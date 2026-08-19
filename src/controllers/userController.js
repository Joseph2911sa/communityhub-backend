import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * GET /api/users
 * Lista todos los usuarios (protect + authorize('admin')). toJSON en
 * User.js ya excluye password y __v de cada documento.
 */
export const listUsers = catchAsync(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { users },
  });
});

/**
 * GET /api/users/:id
 * Retorna un usuario por id (protect + authorize('admin')). 404 si no
 * existe.
 */
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('Usuario no encontrado.', 404));
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * PUT /api/users/:id
 * Actualiza SOLO role/isActive de un usuario (protect + authorize('admin')).
 * Un admin no puede modificarse a sí mismo desde aquí, para evitar que
 * se auto-degrade o desactive por error y quede bloqueado del sistema.
 */
export const updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('Usuario no encontrado.', 404));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('No puedes modificar tu propia cuenta desde aquí.', 403));
  }

  const { role, isActive } = req.body;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Usuario actualizado exitosamente.',
    data: { user },
  });
});

/**
 * DELETE /api/users/:id
 * Soft-delete: desactiva la cuenta (isActive:false), nunca borra el
 * documento. Mismo bloqueo de autoprotección que updateUser. Un
 * usuario desactivado ya no puede hacer login (ver authController.js).
 */
export const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('Usuario no encontrado.', 404));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('No puedes modificar tu propia cuenta desde aquí.', 403));
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Usuario desactivado exitosamente.',
  });
});

/**
 * PUT /api/users/me
 * Autoservicio: cualquier usuario autenticado actualiza SU PROPIO
 * perfil. Acepta solo firstName/lastName/profilePicture -- role e
 * isActive se ignoran aunque vengan en el body, aquí no es gestión de
 * admin. La validación de profilePicture (formato + tamaño) ya corrió
 * en updateMyProfileValidator antes de llegar aquí.
 */
export const updateMyProfile = catchAsync(async (req, res) => {
  const { firstName, lastName, profilePicture } = req.body;

  if (firstName !== undefined) req.user.firstName = firstName;
  if (lastName !== undefined) req.user.lastName = lastName;
  if (profilePicture !== undefined) req.user.profilePicture = profilePicture;

  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Perfil actualizado exitosamente.',
    data: { user: req.user },
  });
});
