import Event, { EVENT_STATUS } from '../models/Event.js';
import Category from '../models/Category.js';
import Registration from '../models/Registration.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { getEventDateTime } from '../utils/getEventDateTime.js';

const CATEGORY_POPULATE = 'name';
const ORGANIZER_POPULATE = 'firstName lastName email';

/**
 * Escapa los caracteres especiales de regex de un texto libre, para
 * poder usarlo de forma segura dentro de un RegExp sin que actúe como
 * comodín ni rompa la consulta (ej. ".", "*", "(").
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Calcula confirmedCount y spotsLeft (inscripciones confirmadas reales
 * vs cupo) para uno o varios eventos, y los agrega al resultado.
 * Acepta un solo documento de Event o un array de ellos. Siempre
 * retorna objeto(s) plano(s) -- no documentos de Mongoose -- para que
 * los campos extra queden en la respuesta JSON (asignar propiedades
 * directo a un documento de Mongoose no se serializa).
 */
const addOccupancyData = async (eventOrEvents) => {
  const isArray = Array.isArray(eventOrEvents);
  const events = isArray ? eventOrEvents : [eventOrEvents];

  const withOccupancy = await Promise.all(
    events.map(async (event) => {
      const confirmedCount = await Registration.countDocuments({
        event: event._id,
        status: 'confirmed',
      });
      const spotsLeft = Math.max(event.maxCapacity - confirmedCount, 0);
      return { ...event.toObject(), confirmedCount, spotsLeft };
    })
  );

  return isArray ? withOccupancy : withOccupancy[0];
};

/**
 * Construye el filtro de Mongo a partir de los query params soportados
 * por GET /api/events (sección 12 del enunciado).
 */
const buildEventFilter = (query) => {
  const { category, location, organizer, date, available, q } = query;
  const filter = {};

  if (category) filter.category = category;
  if (organizer) filter.organizer = organizer;
  if (location) filter.location = { $regex: location, $options: 'i' };

  const dateFilter = {};
  if (date) {
    dateFilter.$gte = new Date(`${date}T00:00:00.000Z`);
    dateFilter.$lte = new Date(`${date}T23:59:59.999Z`);
  }

  if (available === 'true') {
    filter.status = EVENT_STATUS.ACTIVE;
    // El campo `date` en Mongo no lleva hora (siempre medianoche UTC del
    // día), así que a nivel de base de datos solo podemos filtrar por
    // día calendario: dejamos pasar TODO el día de hoy en adelante. El
    // filtro preciso a la hora exacta se aplica después en JS con
    // getEventDateTime (ver listEvents), una vez poblados los eventos.
    const now = new Date();
    const todayUTCMidnight = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    dateFilter.$gte =
      dateFilter.$gte && dateFilter.$gte > todayUTCMidnight ? dateFilter.$gte : todayUTCMidnight;
  }

  if (Object.keys(dateFilter).length > 0) filter.date = dateFilter;

  // Coincidencia parcial de verdad (substring, no palabra completa) para
  // "buscar mientras escribes". $text no sirve para esto: solo empareja
  // palabras completas o su raíz gramatical.
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

  return filter;
};

/**
 * GET /api/events
 * Lista actividades con filtros combinables por query params. Pública.
 */
export const listEvents = catchAsync(async (req, res) => {
  const filter = buildEventFilter(req.query);

  let events = await Event.find(filter)
    .populate('category', CATEGORY_POPULATE)
    .populate('organizer', ORGANIZER_POPULATE)
    .sort({ date: 1 });

  if (req.query.available === 'true') {
    // Filtro preciso a la hora exacta (el filtro de Mongo de arriba solo
    // pudo descartar por día calendario, no por hora).
    const now = new Date();
    events = events.filter((event) => getEventDateTime(event.date, event.time) >= now);
  }

  const eventsWithOccupancy = await addOccupancyData(events);

  res.status(200).json({
    success: true,
    data: { events: eventsWithOccupancy },
  });
});

/**
 * GET /api/events/:id
 * Retorna una actividad por id, populada. Pública.
 */
export const getEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
    .populate('category', CATEGORY_POPULATE)
    .populate('organizer', ORGANIZER_POPULATE);

  if (!event) {
    return next(new AppError('Actividad no encontrada.', 404));
  }

  const { confirmedCount, spotsLeft } = await addOccupancyData(event);

  res.status(200).json({
    success: true,
    data: { event, confirmedCount, spotsLeft },
  });
});

/**
 * POST /api/events
 * Crea una actividad (protect + authorize('organizer', 'admin')).
 * El organizador se toma siempre de req.user, nunca del body, y el
 * status siempre inicia en 'active' sin importar lo que venga en el body.
 */
export const createEvent = catchAsync(async (req, res, next) => {
  const { title, description, category, date, time, location, maxCapacity, image } = req.body;

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new AppError('La categoría indicada no existe.', 400));
  }

  const event = await Event.create({
    title,
    description,
    category,
    date,
    time,
    location,
    maxCapacity,
    image,
    organizer: req.user._id,
    status: EVENT_STATUS.ACTIVE,
  });

  res.status(201).json({
    success: true,
    message: 'Actividad creada exitosamente.',
    data: { event },
  });
});

/**
 * PUT /api/events/:id
 * Actualiza una actividad (protect + authorize('organizer', 'admin')).
 * Ownership: solo el organizador dueño o un admin puede modificarla.
 * El organizer nunca se puede reasignar desde este endpoint.
 */
export const updateEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new AppError('Actividad no encontrada.', 404));
  }

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    return next(new AppError('No puede modificar actividades de otro organizador.', 403));
  }

  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return next(new AppError('La categoría indicada no existe.', 400));
    }
  }

  const updatableFields = [
    'title',
    'description',
    'category',
    'date',
    'time',
    'location',
    'maxCapacity',
    'image',
    'status',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      event[field] = req.body[field];
    }
  });
  // organizer nunca se reasigna desde este endpoint, aunque venga en el body.

  await event.save();

  res.status(200).json({
    success: true,
    message: 'Actividad actualizada exitosamente.',
    data: { event },
  });
});

/**
 * DELETE /api/events/:id
 * Elimina una actividad (protect + authorize('organizer', 'admin')).
 * Ownership: solo el organizador dueño o un admin puede eliminarla.
 */
export const deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new AppError('Actividad no encontrada.', 404));
  }

  const isOwner = event.organizer.toString() === req.user._id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    return next(new AppError('No puede modificar actividades de otro organizador.', 403));
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Actividad eliminada exitosamente.',
  });
});
