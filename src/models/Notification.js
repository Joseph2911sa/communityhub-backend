import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['reminder', 'update', 'system'],
      default: 'system',
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
  },
  { timestamps: true }
);

const Notification = model('Notification', notificationSchema);

export default Notification;
