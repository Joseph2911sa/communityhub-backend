import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CommunityHub API funcionando correctamente.' });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);

// Próximos avances: /users, /events, /favorites, /notifications

export default router;
