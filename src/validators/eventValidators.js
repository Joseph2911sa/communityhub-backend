import { body } from 'express-validator';

export const createEventValidator = [
  body('title').trim().notEmpty().withMessage('El título es obligatorio.'),
  body('category').isMongoId().withMessage('Debe proporcionar una categoría válida.'),
  body('date').isISO8601().toDate().withMessage('Debe proporcionar una fecha válida.'),
  body('location').trim().notEmpty().withMessage('La ubicación es obligatoria.'),
  body('maxCapacity')
    .isInt({ min: 1 })
    .withMessage('La capacidad máxima debe ser un número entero mayor o igual a 1.'),
  body('time').optional().isString().withMessage('La hora debe ser texto.'),
  body('description').optional().isString().withMessage('La descripción debe ser texto.'),
];

export const updateEventValidator = [
  body('title').optional().trim().notEmpty().withMessage('El título no puede estar vacío.'),
  body('category').optional().isMongoId().withMessage('Debe proporcionar una categoría válida.'),
  body('date').optional().isISO8601().toDate().withMessage('Debe proporcionar una fecha válida.'),
  body('location').optional().trim().notEmpty().withMessage('La ubicación no puede estar vacía.'),
  body('maxCapacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La capacidad máxima debe ser un número entero mayor o igual a 1.'),
  body('time').optional().isString().withMessage('La hora debe ser texto.'),
  body('description').optional().isString().withMessage('La descripción debe ser texto.'),
];
