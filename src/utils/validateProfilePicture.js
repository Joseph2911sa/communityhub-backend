/**
 * Valida que un valor sea un data URL de imagen (PNG/JPG/GIF/WEBP) en
 * base64 de máximo 5MB reales, o que sea null/undefined (campo
 * opcional). Se reutiliza tanto en el registro (authValidators.js)
 * como en la actualización de perfil propia (userController.js).
 */
export function isValidProfilePicture(value) {
  if (value === null || value === undefined) return true; // opcional

  if (typeof value !== 'string') return false;

  const match = value.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/);
  if (!match) return false;

  const base64Payload = match[2];
  const sizeInBytes = (base64Payload.length * 3) / 4;

  return sizeInBytes <= 5 * 1024 * 1024; // 5MB
}
