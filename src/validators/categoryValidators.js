import { body } from 'express-validator';

export const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la categoría es obligatorio.')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres.'),
  body('description')
    .optional()
    .isString()
    .withMessage('La descripción debe ser texto.'),
];

export const updateCategoryValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres.'),
  body('description')
    .optional()
    .isString()
    .withMessage('La descripción debe ser texto.'),
];
