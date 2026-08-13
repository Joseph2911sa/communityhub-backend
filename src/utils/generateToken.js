import jwt from 'jsonwebtoken';

/**
 * Genera un JWT firmado que contiene el id y rol del usuario.
 * @param {{ id: string, role: string }} payload
 * @returns {string} token JWT
 */
const generateToken = ({ id, role }) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export default generateToken;
