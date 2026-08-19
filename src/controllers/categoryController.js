import Category from '../models/Category.js';
import Event from '../models/Event.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * GET /api/categories
 * Lista todas las categorías. Pública: el frontend la necesita para
 * mostrar filtros incluso sin login.
 */
export const listCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: { categories },
  });
});

export const getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Categoría no encontrada.', 404));
  }

  res.status(200).json({
    success: true,
    data: { category },
  });
});

export const createCategory = catchAsync(async (req, res) => {
  const { name, description } = req.body;

  const category = await Category.create({ name, description });

  res.status(201).json({
    success: true,
    message: 'Categoría creada exitosamente.',
    data: { category },
  });
});

export const updateCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Categoría no encontrada.', 404));
  }

  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;

  await category.save();

  res.status(200).json({
    success: true,
    message: 'Categoría actualizada exitosamente.',
    data: { category },
  });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Categoría no encontrada.', 404));
  }

  const associatedEventsCount = await Event.countDocuments({ category: category._id });
  if (associatedEventsCount > 0) {
    return next(
      new AppError('No se puede eliminar una categoría que tiene actividades asociadas.', 409)
    );
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Categoría eliminada exitosamente.',
  });
});
