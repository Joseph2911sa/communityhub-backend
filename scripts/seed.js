import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Category from '../src/models/Category.js';
import User from '../src/models/User.js';

const CATEGORY_NAMES = [
  'Tecnología',
  'Deportes',
  'Arte y Cultura',
  'Bienestar',
  'Educación',
  'Comunidad',
];

const SEED_USERS = [
  {
    email: 'admin@communityhub.com',
    password: 'Admin12345',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'CommunityHub',
  },
  {
    email: 'organizador@communityhub.com',
    password: 'Organizador12345',
    role: 'organizer',
    firstName: 'Organizador',
    lastName: 'Ejemplo',
  },
];

/**
 * Crea las categorías iniciales si no existen (idempotente: busca por
 * name antes de crear).
 */
const seedCategories = async () => {
  let created = 0;
  let existing = 0;

  for (const name of CATEGORY_NAMES) {
    const found = await Category.findOne({ name });
    if (found) {
      existing += 1;
      continue;
    }

    await Category.create({ name });
    created += 1;
  }

  return { created, existing };
};

/**
 * Crea los usuarios de ejemplo si no existen (idempotente: busca por
 * email antes de crear). El password se pasa en texto plano — lo
 * hashea el hook pre-save de User.js, no se hashea manualmente aquí.
 */
const seedUsers = async () => {
  const results = [];

  for (const userData of SEED_USERS) {
    const found = await User.findOne({ email: userData.email });
    if (found) {
      results.push({ email: userData.email, role: userData.role, created: false });
      continue;
    }

    await User.create(userData);
    results.push({ email: userData.email, role: userData.role, created: true });
  }

  return results;
};

const runSeed = async () => {
  await connectDB();

  const categoriesResult = await seedCategories();
  const usersResult = await seedUsers();

  console.log('\n📋 Resumen del seed:');
  console.log(
    `   Categorías: ${categoriesResult.created} creadas, ${categoriesResult.existing} ya existían.`
  );
  usersResult.forEach(({ email, role, created }) => {
    console.log(
      `   Usuario ${email} (${role}): ${created ? 'creado' : 'ya existía'}.`
    );
  });

  await mongoose.connection.close();
  process.exit(0);
};

runSeed().catch(async (error) => {
  console.error('❌ Error corriendo el seed:', error.message);
  await mongoose.connection.close();
  process.exit(1);
});
