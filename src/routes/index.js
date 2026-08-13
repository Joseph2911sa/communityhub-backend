import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import eventRoutes from './eventRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CommunityHub API funcionando correctamente.' });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/events', eventRoutes);

// Próximos avances: /users, /favorites, /notifications

export default router;
