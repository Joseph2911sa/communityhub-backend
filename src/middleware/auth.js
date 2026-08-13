import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/User.js';

/**
 * Middleware "protect": exige un JWT válido en el header Authorization.
 * Formato esperado: Authorization: Bearer <token>
 *
 * Endpoints como GET/POST/PUT/DELETE /api/events que requieran cuenta
 * deben usar este middleware (sección 5 del enunciado).
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('No autenticado. Debe iniciar sesión.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Token inválido o expirado.', 401));
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser || !currentUser.isActive) {
    return next(new AppError('El usuario asociado a este token ya no existe o está inactivo.', 401));
  }

  req.user = currentUser;
  next();
});

export default protect;
