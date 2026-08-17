import mongoose from 'mongoose';
import { getEventDateTime } from '../utils/getEventDateTime.js';

const { Schema, model } = mongoose;

export const EVENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  FINISHED: 'finished',
});

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria'],
    },
    date: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
      validate: {
        validator: function isNotPastDate(value) {
          if (!this.time) return true; // deja que el required de `time` reporte su propio error

          // value ya está anclado a medianoche UTC del día calendario.
          // getEventDateTime lo combina con `time` para obtener el
          // instante real (helper compartido con eventController.js y
          // registrationController.js).
          return getEventDateTime(value, this.time) >= new Date();
        },
        message: 'No se permiten actividades con fecha en el pasado',
      },
    },
    time: {
      type: String, // formato HH:mm
      required: [true, 'La hora es obligatoria'],
    },
    location: {
      type: String,
      required: [true, 'La ubicación es obligatoria'],
      trim: true,
    },
    maxCapacity: {
      type: Number,
      required: [true, 'La capacidad máxima es obligatoria'],
      min: [1, 'La capacidad no puede ser negativa ni cero'],
    },
    image: {
      type: String,
      default: null,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

// Índices útiles para búsqueda y filtros (sección 12 del enunciado)
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ category: 1, date: 1, status: 1 });

const Event = model('Event', eventSchema);

export default Event;
