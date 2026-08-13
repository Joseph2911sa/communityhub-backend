/**
 * Error operacional estandarizado para toda la aplicación.
 * Permite responder siempre con { success: false, message } sin filtrar
 * detalles internos de MongoDB o de Node al cliente (sección 22 del enunciado).
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
