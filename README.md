# CommunityHub — Backend

API REST construida con **Express.js** y **MongoDB (Mongoose)**.

## 📦 Requisitos

- Node.js 18+
- Una instancia de MongoDB (local o Atlas)

## ⚙️ Instalación

```bash
npm install
cp .env.example .env
```

Editar `.env` y completar al menos:

```
MONGODB_URI=mongodb://localhost:27017/communityhub
JWT_SECRET=un_secreto_largo_y_aleatorio
```

## ▶️ Ejecución

```bash
npm run dev     # con nodemon (recarga automática)
npm start       # producción
```

El servidor arranca en `http://localhost:3000` (o el puerto definido en `PORT`).

## 📂 Estructura

```
communityhub-backend/
├── src/
│   ├── config/        # Conexión a MongoDB, constantes (roles)
│   ├── controllers/   # Lógica de negocio (auth)
│   ├── middleware/     # protect, authorize, validate, errorHandler, notFound
│   ├── models/         # Esquemas de Mongoose (User, Event, Category, Registration, Favorite, Notification)
│   ├── routes/         # Definición de endpoints
│   ├── validators/     # Reglas de validación (express-validator)
│   ├── utils/           # AppError, generateToken, catchAsync
│   ├── app.js           # Configuración de Express (middlewares, rutas, errores)
│   └── server.js        # Punto de entrada (conecta BD + levanta servidor)
├── .env                  # No versionado
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## ✅ Estado actual — Avance 1

- [x] Conexión a MongoDB vía Mongoose (`src/config/db.js`)
- [x] Modelos iniciales: `User`, `Category`, `Event`, `Registration`, `Favorite`, `Notification`
- [x] Autenticación JWT configurada:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me` (protegida)
  - `POST /api/auth/logout` (protegida)
- [x] Contraseñas hasheadas con bcrypt (nunca en texto plano)
- [x] Middleware de protección de rutas (`protect`) y autorización por rol (`authorize`)
- [x] Manejo centralizado de errores (400 / 401 / 403 / 404 / 409 / 500), sin exponer errores internos de MongoDB
- [x] Validación de entrada con `express-validator`
- [x] `GET /api/health` para verificar que el servicio está en línea

### Pendiente para próximos avances

- CRUD completo de `events`, `categories`
- Inscripciones (`/api/events/:id/register`) y favoritos (`/api/events/:id/favorite`)
- Endpoints de `users` (roles: admin/organizer/user) y dashboards
- Búsqueda y filtros por query params
- Integración con AWS Lambda

## 🔑 Prueba rápida de la autenticación

```bash
# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ana","lastName":"Pérez","email":"ana@example.com","password":"password123"}'

# Iniciar sesión
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"password123"}'

# Usuario actual (reemplazar <TOKEN> por el recibido en el login)
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <TOKEN>"
```
