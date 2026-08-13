import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const favoriteSchema = new Schema(
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
  },
  { timestamps: true }
);

// Un usuario no puede marcar la misma actividad como favorita más de una vez
favoriteSchema.index({ user: 1, event: 1 }, { unique: true });

const Favorite = model('Favorite', favoriteSchema);

export default Favorite;
