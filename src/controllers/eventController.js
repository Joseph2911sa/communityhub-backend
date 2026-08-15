import Event, { EVENT_STATUS } from '../models/Event.js';
import Category from '../models/Category.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const CATEGORY_POPULATE = 'name';
const ORGANIZER_POPULATE = 'firstName lastName email';

/**
 * Escapa los caracteres especiales de regex de un texto libre, para
 * poder usarlo de forma segura dentro de un RegExp sin que actúe como
 * comodín ni rompa la consulta (ej. ".", "*", "(").
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    const now = new Date();
    dateFilter.$gte = dateFilter.$gte && dateFilter.$gte > now ? dateFilter.$gte : now;
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

  const events = await Event.find(filter)
    .populate('category', CATEGORY_POPULATE)
    .populate('organizer', ORGANIZER_POPULATE)
    .sort({ date: 1 });

  res.status(200).json({
    success: true,
    data: { events },
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

  res.status(200).json({
    success: true,
    data: { event },
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
