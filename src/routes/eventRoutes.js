import { Router } from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import {
  registerForEvent,
  cancelRegistration,
} from '../controllers/registrationController.js';
import { addFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { createEventValidator, updateEventValidator } from '../validators/eventValidators.js';
import validate from '../middleware/validate.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post(
  '/',
  protect,
  authorize('organizer', 'admin'),
  createEventValidator,
  validate,
  createEvent
);
router.put(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  updateEventValidator,
  validate,
  updateEvent
);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

router.post('/:id/register', protect, registerForEvent);
router.delete('/:id/register', protect, cancelRegistration);
router.post('/:id/favorite', protect, addFavorite);
router.delete('/:id/favorite', protect, removeFavorite);

export default router;
