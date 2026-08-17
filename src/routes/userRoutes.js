import { Router } from 'express';
import { getMyRegistrations } from '../controllers/registrationController.js';
import { getMyFavorites } from '../controllers/favoriteController.js';
import {
  getMyNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController.js';
import {
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
} from '../controllers/userController.js';
import { updateUserValidator } from '../validators/userValidators.js';
import validate from '../middleware/validate.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = Router();

// CRUD de gestión de usuarios (solo admin). Va ANTES de las rutas
// /me/* para que Express no confunda ":id" con la palabra "me".
router.get('/', protect, authorize('admin'), listUsers);
router.get('/:id', protect, authorize('admin'), getUser);
router.put('/:id', protect, authorize('admin'), updateUserValidator, validate, updateUser);
router.delete('/:id', protect, authorize('admin'), deactivateUser);

router.get('/me/registrations', protect, getMyRegistrations);
router.get('/me/favorites', protect, getMyFavorites);
router.get('/me/notifications', protect, getMyNotifications);
router.patch('/me/notifications/:id/read', protect, markNotificationAsRead);

export default router;
