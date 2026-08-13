import { body } from 'express-validator';

export const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio.'),
  body('email').trim().isEmail().withMessage('Debe proporcionar un correo electrónico válido.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.'),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('Debe proporcionar un correo electrónico válido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
];
