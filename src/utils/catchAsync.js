/**
 * Envuelve un controlador async y reenvía cualquier error a next(),
 * para que llegue al middleware centralizado de manejo de errores.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
