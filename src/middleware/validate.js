import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

/**
 * Ejecuta después de un arreglo de validaciones de express-validator.
 * Si hay errores, responde 400 con el primer mensaje encontrado.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return next(new AppError(firstError, 400));
  }

  next();
};

export default validate;
