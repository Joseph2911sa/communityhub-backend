import Notification from '../models/Notification.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const EVENT_POPULATE = 'title date time location';

/**
 * GET /api/users/me/notifications
 * Lista todas las notificaciones del usuario autenticado, con el evento
 * relacionado poblado, ordenadas de más reciente a más antigua. Incluye
 * unreadCount aparte para que el frontend no tenga que contarlas.
 */
export const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate('relatedEvent', EVENT_POPULATE)
    .sort({ createdAt: -1 });

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  res.status(200).json({
    success: true,
    data: { notifications, unreadCount },
  });
});

/**
 * PATCH /api/users/me/notifications/:id/read
 * Marca una notificación como leída. 404 tanto si no existe como si
 * existe pero pertenece a otro usuario (mismo mensaje en ambos casos,
 * para no revelar la existencia de notificaciones ajenas).
 */
export const markNotificationAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    return next(new AppError('Notificación no encontrada.', 404));
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notificación marcada como leída.',
    data: { notification },
  });
});
