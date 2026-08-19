import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ROLE_VALUES } from '../config/roles.js';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El correo electrónico no es válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Nunca exponer el hash de la contraseña al serializar a JSON
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = model('User', userSchema);

export default User;
