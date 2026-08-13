import AppError from '../utils/AppError.js';

/**
 * Traduce errores conocidos de Mongoose/MongoDB a AppError con un
 * mensaje seguro para el cliente (nunca se expone el error interno crudo).
 */
const normalizeError = (err) => {
  // ObjectId inválido -> 400
  if (err.name === 'CastError') {
    return new AppError(`Identificador inválido: ${err.value}`, 400);
  }

  // Violación de índice único (correo duplicado, inscripción duplicada, etc.) -> 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    return new AppError(`Ya existe un registro con ese ${field}.`, 409);
  }

  // Errores de validación de Mongoose -> 400
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
    return new AppError(message || 'Datos inválidos.', 400);
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token inválido.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('El token ha expirado.', 401);
  }

  return err;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  const statusCode = normalized.statusCode || 500;
  const message = normalized.isOperational
    ? normalized.message
    : 'Ocurrió un error interno en el servidor.';

  if (!normalized.isOperational) {
    // Solo se registra en consola del servidor; nunca se envía al cliente.
    console.error('💥 Error no operacional:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
