import AppError from '../utils/AppError.js';

/**
 * Middleware de autorización basada en roles.
 * Uso: router.delete('/:id', protect, authorize('admin'), controller)
 *
 * Debe usarse SIEMPRE después de `protect`, ya que depende de req.user.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('No tiene permisos suficientes para realizar esta acción.', 403)
      );
    }

    next();
  };
};

export default authorize;
