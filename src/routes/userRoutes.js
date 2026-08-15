import { Router } from 'express';
import { getMyRegistrations } from '../controllers/registrationController.js';
import { getMyFavorites } from '../controllers/favoriteController.js';
import {
  getMyNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController.js';
import protect from '../middleware/auth.js';

// Nota: aquí solo van los endpoints /me/*. El CRUD completo de
// /api/users (GET, GET/:id, PUT/:id, DELETE/:id con protect + authorize
// ('admin')) es tarea aparte, pendiente.
const router = Router();

router.get('/me/registrations', protect, getMyRegistrations);
router.get('/me/favorites', protect, getMyFavorites);
router.get('/me/notifications', protect, getMyNotifications);
router.patch('/me/notifications/:id/read', protect, markNotificationAsRead);

export default router;
