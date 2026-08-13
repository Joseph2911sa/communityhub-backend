import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CommunityHub API funcionando correctamente.' });
});

router.use('/auth', authRoutes);

// Próximos avances: /users, /events, /categories, /favorites, /notifications

export default router;
