import { body } from 'express-validator';
import { ROLE_VALUES } from '../config/roles.js';

export const updateUserValidator = [
  body('role')
    .optional()
    .isIn(ROLE_VALUES)
    .withMessage(`El rol debe ser uno de: ${ROLE_VALUES.join(', ')}.`),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un valor booleano.'),
];
