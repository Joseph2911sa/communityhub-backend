import Registration from '../models/Registration.js';
import Event, { EVENT_STATUS } from '../models/Event.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { getEventDateTime } from '../utils/getEventDateTime.js';

const EVENT_POPULATE = 'title date time location image status';

/**
 * POST /api/events/:id/register
 * Inscribe al usuario autenticado en una actividad.
 *
 * Registration tiene un índice único {user, event}, así que nunca se
 * puede crear más de un documento por par usuario+evento. Si el usuario
 * ya se había inscrito y canceló, se reutiliza ese mismo documento
 * (se reactiva a 'confirmed') en vez de crear uno nuevo.
 */
export const registerForEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new AppError('Actividad no encontrada.', 404));
  }

  if (event.status !== EVENT_STATUS.ACTIVE || getEventDateTime(event.date, event.time) < new Date()) {
    return next(new AppError('El evento ya no está disponible para inscripciones.', 400));
  }

  const existingRegistration = await Registration.findOne({
    user: req.user._id,
    event: event._id,
  });

  if (existingRegistration && existingRegistration.status === 'confirmed') {
    return next(new AppError('Ya estás inscrito en esta actividad.', 409));
  }

  const confirmedCount = await Registration.countDocuments({
    event: event._id,
    status: 'confirmed',
  });
  if (confirmedCount >= event.maxCapacity) {
    return next(new AppError('Ya no hay cupos disponibles.', 409));
  }

  if (existingRegistration) {
    // Ya existía (cancelada): se reactiva el mismo documento, no se crea otro.
    existingRegistration.status = 'confirmed';
    await existingRegistration.save();

    return res.status(200).json({
      success: true,
      message: 'Te has vuelto a inscribir en esta actividad.',
      data: { registration: existingRegistration },
    });
  }

  const registration = await Registration.create({
    user: req.user._id,
    event: event._id,
    status: 'confirmed',
  });

  res.status(201).json({
    success: true,
    message: 'Inscripción realizada exitosamente.',
    data: { registration },
  });
});

/**
 * DELETE /api/events/:id/register
 * Cancela la inscripción activa del usuario en una actividad.
 * No se borra el documento (queda como historial), solo se marca
 * status:'cancelled'.
 */
export const cancelRegistration = catchAsync(async (req, res, next) => {
  const registration = await Registration.findOne({
    user: req.user._id,
    event: req.params.id,
    status: 'confirmed',
  });

  if (!registration) {
    return next(new AppError('No tienes una inscripción activa en esta actividad.', 404));
  }

  registration.status = 'cancelled';
  await registration.save();

  res.status(200).json({
    success: true,
    message: 'Inscripción cancelada exitosamente.',
  });
});

/**
 * GET /api/users/me/registrations
 * Lista todas las inscripciones (historial completo, incluye canceladas)
 * del usuario autenticado, con el evento poblado, ordenadas por fecha
 * del evento.
 */
export const getMyRegistrations = catchAsync(async (req, res) => {
  const registrations = await Registration.find({ user: req.user._id })
    .populate('event', EVENT_POPULATE)
    .sort({ createdAt: -1 });

  registrations.sort((a, b) => {
    if (!a.event || !b.event) return 0;
    // getEventDateTime combina date+time para un orden cronológico real
    // (dos eventos del mismo día calendario pero horas distintas no
    // deben quedar "empatados").
    return (
      getEventDateTime(a.event.date, a.event.time) - getEventDateTime(b.event.date, b.event.time)
    );
  });

  res.status(200).json({
    success: true,
    data: { registrations },
  });
});
