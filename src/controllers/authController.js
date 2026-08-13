import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import generateToken from '../utils/generateToken.js';

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

/**
 * POST /api/auth/register
 * Crea una cuenta de usuario. Valida datos, verifica correo único,
 * hashea la contraseña (vía hook pre-save del modelo) y crea el usuario.
 */
export const register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, profilePicture } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('Ya existe una cuenta registrada con ese correo electrónico.', 409));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    profilePicture: profilePicture || null,
  });

  const token = generateToken({ id: user._id, role: user.role });
  res.cookie('token', token, cookieOptions);

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente.',
    data: { user, token },
  });
});

/**
 * POST /api/auth/login
 * Verifica credenciales y retorna un JWT.
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Correo electrónico o contraseña incorrectos.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Esta cuenta se encuentra desactivada.', 403));
  }

  const token = generateToken({ id: user._id, role: user.role });
  res.cookie('token', token, cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Inicio de sesión exitoso.',
    data: { user, token },
  });
});

/**
 * GET /api/auth/me
 * Retorna la información del usuario autenticado (requiere `protect`).
 */
export const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

/**
 * POST /api/auth/logout
 * Limpia la cookie del JWT. Si el cliente guarda el token en localStorage,
 * el logout es responsabilidad del frontend (descartar el token).
 */
export const logout = catchAsync(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });

  res.status(200).json({
    success: true,
    message: 'Sesión cerrada exitosamente.',
  });
});
