import Favorite from '../models/Favorite.js';
import Event from '../models/Event.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const EVENT_POPULATE = 'title date time location image status maxCapacity';

/**
 * POST /api/events/:id/favorite
 * Marca una actividad como favorita del usuario autenticado.
 *
 * Se verifica explícitamente con findOne ANTES de crear (en vez de
 * confiar solo en el índice único del modelo) para poder responder un
 * 409 con un mensaje claro, en vez del genérico que da errorHandler
 * para violaciones de índice compuesto.
 */
export const addFavorite = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next(new AppError('Actividad no encontrada.', 404));
  }

  const existingFavorite = await Favorite.findOne({ user: req.user._id, event: event._id });
  if (existingFavorite) {
    return next(new AppError('Este evento ya está en tus favoritos.', 409));
  }

  const favorite = await Favorite.create({ user: req.user._id, event: event._id });

  res.status(201).json({
    success: true,
    message: 'Actividad agregada a favoritos.',
    data: { favorite },
  });
});

/**
 * DELETE /api/events/:id/favorite
 * Quita una actividad de los favoritos del usuario autenticado.
 */
export const removeFavorite = catchAsync(async (req, res, next) => {
  const favorite = await Favorite.findOneAndDelete({
    user: req.user._id,
    event: req.params.id,
  });

  if (!favorite) {
    return next(new AppError('Este evento no está en tus favoritos.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Actividad eliminada de favoritos.',
  });
});

/**
 * GET /api/users/me/favorites
 * Lista todas las actividades favoritas del usuario autenticado, con el
 * evento poblado.
 */
export const getMyFavorites = catchAsync(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id })
    .populate('event', EVENT_POPULATE)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { favorites },
  });
});
