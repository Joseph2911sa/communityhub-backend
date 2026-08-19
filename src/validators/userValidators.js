import { body } from 'express-validator';
import { ROLE_VALUES } from '../config/roles.js';
import { isValidProfilePicture } from '../utils/validateProfilePicture.js';

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

export const updateMyProfileValidator = [
  body('firstName').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  body('lastName').optional().trim().notEmpty().withMessage('El apellido no puede estar vacío.'),
  body('profilePicture')
    .optional()
    .custom((value) => isValidProfilePicture(value))
    .withMessage(
      'La foto de perfil debe ser una imagen válida (PNG, JPG, GIF o WEBP) de máximo 5MB.'
    ),
];
