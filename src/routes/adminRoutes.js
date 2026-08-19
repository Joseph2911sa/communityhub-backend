import { Router } from 'express';
import { getStatistics } from '../controllers/adminController.js';
import protect from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';

const router = Router();

router.get('/statistics', protect, authorize('admin'), getStatistics);

export default router;
