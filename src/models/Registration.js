import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const registrationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

// Un usuario no puede inscribirse dos veces en la misma actividad
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

const Registration = model('Registration', registrationSchema);

export default Registration;
