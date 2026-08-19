import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);
// Límite subido para admitir foto de perfil en base64 (hasta 5MB reales
// ~= 6.7MB en texto base64, más margen para el prefijo del data URL).
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/', (req, res) => {
  res.json({ success: true, message: 'CommunityHub API', version: '1.0.0' });
});

app.use('/api', apiRoutes);

// --- Manejo de errores (siempre al final) ---
app.use(notFound);
app.use(errorHandler);

export default app;
