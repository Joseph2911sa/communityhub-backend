import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Category from '../src/models/Category.js';
import User from '../src/models/User.js';
import Event, { EVENT_STATUS } from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';
import Favorite from '../src/models/Favorite.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
  {
    email: 'maria@communityhub.com',
    password: 'Usuario12345',
    role: 'user',
    firstName: 'María',
    lastName: 'Gómez',
  },
  {
    email: 'carlos@communityhub.com',
    password: 'Usuario12345',
    role: 'user',
    firstName: 'Carlos',
    lastName: 'Pérez',
  },
  {
    email: 'lucia@communityhub.com',
    password: 'Usuario12345',
    role: 'user',
    firstName: 'Lucía',
    lastName: 'Ramírez',
  },
  {
    email: 'diego@communityhub.com',
    password: 'Usuario12345',
    role: 'user',
    firstName: 'Diego',
    lastName: 'Torres',
  },
  {
    email: 'valentina@communityhub.com',
    password: 'Usuario12345',
    role: 'user',
    firstName: 'Valentina',
    lastName: 'Rojas',
  },
];

// Uno por cada categoría del seeder. daysFromNow es la distancia relativa
// que debe conservar el evento respecto a "hoy" en cada corrida del seed.
const EVENTS_SEED = [
  {
    title: 'Taller de Introducción a Node.js',
    categoryName: 'Tecnología',
    maxCapacity: 5,
    location: 'Aula 204, Edificio de Ingeniería',
    time: '14:00',
    daysFromNow: 3,
  },
  {
    title: 'Torneo de Fútbol Comunitario',
    categoryName: 'Deportes',
    maxCapacity: 20,
    location: 'Cancha Municipal',
    time: '09:00',
    daysFromNow: 7,
  },
  {
    title: 'Exposición de Arte Local',
    categoryName: 'Arte y Cultura',
    maxCapacity: 30,
    location: 'Centro Cultural',
    time: '18:00',
    daysFromNow: 10,
  },
  {
    title: 'Sesión de Yoga al Aire Libre',
    categoryName: 'Bienestar',
    maxCapacity: 15,
    location: 'Parque Central',
    time: '07:00',
    daysFromNow: 2,
  },
  {
    title: 'Charla sobre Educación Financiera',
    categoryName: 'Educación',
    maxCapacity: 40,
    location: 'Auditorio Principal',
    time: '16:00',
    daysFromNow: 15,
  },
  {
    title: 'Feria Comunitaria de Reciclaje',
    categoryName: 'Comunidad',
    maxCapacity: 50,
    location: 'Plaza del Barrio',
    time: '10:00',
    daysFromNow: 20,
  },
];

// Taller de Node.js queda a 4/5 = 80% de ocupación a propósito, justo en
// el umbral que evalúa la Lambda (OCCUPANCY_THRESHOLD=0.8 por defecto).
const REGISTRATIONS_SEED = [
  { email: 'maria@communityhub.com', eventTitle: 'Taller de Introducción a Node.js' },
  { email: 'carlos@communityhub.com', eventTitle: 'Taller de Introducción a Node.js' },
  { email: 'lucia@communityhub.com', eventTitle: 'Taller de Introducción a Node.js' },
  { email: 'diego@communityhub.com', eventTitle: 'Taller de Introducción a Node.js' },
  { email: 'maria@communityhub.com', eventTitle: 'Torneo de Fútbol Comunitario' },
  { email: 'valentina@communityhub.com', eventTitle: 'Torneo de Fútbol Comunitario' },
  { email: 'carlos@communityhub.com', eventTitle: 'Sesión de Yoga al Aire Libre' },
  { email: 'lucia@communityhub.com', eventTitle: 'Sesión de Yoga al Aire Libre' },
];

// valentina NO está inscrita en el Taller de Node.js a propósito, para
// que la Lambda tenga a quién notificar cuando evalúe ese evento.
const FAVORITES_SEED = [
  { email: 'valentina@communityhub.com', eventTitle: 'Taller de Introducción a Node.js' },
  { email: 'diego@communityhub.com', eventTitle: 'Exposición de Arte Local' },
  { email: 'maria@communityhub.com', eventTitle: 'Charla sobre Educación Financiera' },
];

/**
 * Construye un Date a `days` días desde hoy (UTC), con la hora HH:mm
 * indicada. Se usa tanto para crear eventos nuevos como para "refrescar"
 * la fecha de eventos existentes que ya quedaron en el pasado.
 */
const dateAtDaysFromNow = (days, timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
};

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
 * Devuelve también un mapa email -> _id para que el resto del seed
 * (eventos, inscripciones, favoritos) pueda referenciarlos.
 */
const seedUsers = async () => {
  const results = [];
  const idsByEmail = {};

  for (const userData of SEED_USERS) {
    const found = await User.findOne({ email: userData.email });
    if (found) {
      idsByEmail[userData.email] = found._id;
      results.push({ email: userData.email, role: userData.role, created: false });
      continue;
    }

    const user = await User.create(userData);
    idsByEmail[userData.email] = user._id;
    results.push({ email: userData.email, role: userData.role, created: true });
  }

  return { results, idsByEmail };
};

/**
 * Crea los eventos de ejemplo si no existen (idempotente: busca por
 * title). Si un evento ya existe pero su fecha quedó en el pasado o a
 * menos de 1 día de ahora, la actualiza a la misma distancia relativa
 * original, sin tocar el resto de sus campos. Devuelve un mapa
 * title -> _id para inscripciones/favoritos.
 */
const seedEvents = async (organizerId) => {
  let created = 0;
  let existing = 0;
  let dateRefreshed = 0;
  const eventIds = {};

  for (const eventDef of EVENTS_SEED) {
    const category = await Category.findOne({ name: eventDef.categoryName });
    if (!category) {
      throw new Error(
        `No se encontró la categoría "${eventDef.categoryName}" — el seed de categorías debe correr primero.`
      );
    }

    const targetDate = dateAtDaysFromNow(eventDef.daysFromNow, eventDef.time);
    const found = await Event.findOne({ title: eventDef.title });

    if (found) {
      eventIds[eventDef.title] = found._id;
      existing += 1;

      const isStale = found.date.getTime() < Date.now() + ONE_DAY_MS;
      if (isStale) {
        found.date = targetDate;
        await found.save();
        dateRefreshed += 1;
      }
      continue;
    }

    const event = await Event.create({
      title: eventDef.title,
      category: category._id,
      date: targetDate,
      time: eventDef.time,
      location: eventDef.location,
      maxCapacity: eventDef.maxCapacity,
      organizer: organizerId,
      status: EVENT_STATUS.ACTIVE,
    });
    eventIds[eventDef.title] = event._id;
    created += 1;
  }

  return { created, existing, dateRefreshed, eventIds };
};

/**
 * Inscribe usuarios en eventos (idempotente: find-or-create respetando
 * el índice único {user, event} de Registration).
 */
const seedRegistrations = async (idsByEmail, eventIds) => {
  let created = 0;
  let existing = 0;

  for (const { email, eventTitle } of REGISTRATIONS_SEED) {
    const userId = idsByEmail[email];
    const eventId = eventIds[eventTitle];

    const found = await Registration.findOne({ user: userId, event: eventId });
    if (found) {
      existing += 1;
      continue;
    }

    await Registration.create({ user: userId, event: eventId, status: 'confirmed' });
    created += 1;
  }

  return { created, existing };
};

/**
 * Marca eventos como favoritos (idempotente: find-or-create respetando
 * el índice único {user, event} de Favorite).
 */
const seedFavorites = async (idsByEmail, eventIds) => {
  let created = 0;
  let existing = 0;

  for (const { email, eventTitle } of FAVORITES_SEED) {
    const userId = idsByEmail[email];
    const eventId = eventIds[eventTitle];

    const found = await Favorite.findOne({ user: userId, event: eventId });
    if (found) {
      existing += 1;
      continue;
    }

    await Favorite.create({ user: userId, event: eventId });
    created += 1;
  }

  return { created, existing };
};

const runSeed = async () => {
  await connectDB();

  const categoriesResult = await seedCategories();
  const { results: usersResults, idsByEmail } = await seedUsers();
  const eventsResult = await seedEvents(idsByEmail['organizador@communityhub.com']);
  const registrationsResult = await seedRegistrations(idsByEmail, eventsResult.eventIds);
  const favoritesResult = await seedFavorites(idsByEmail, eventsResult.eventIds);

  console.log('\n📋 Resumen del seed:');
  console.log(
    `   Categorías: ${categoriesResult.created} creadas, ${categoriesResult.existing} ya existían.`
  );
  usersResults.forEach(({ email, role, created }) => {
    console.log(`   Usuario ${email} (${role}): ${created ? 'creado' : 'ya existía'}.`);
  });
  console.log(
    `   Eventos: ${eventsResult.created} creados, ${eventsResult.existing} ya existían` +
      (eventsResult.dateRefreshed > 0
        ? ` (${eventsResult.dateRefreshed} con fecha refrescada por estar vencida)`
        : '') +
      '.'
  );
  console.log(
    `   Inscripciones: ${registrationsResult.created} creadas, ${registrationsResult.existing} ya existían.`
  );
  console.log(
    `   Favoritos: ${favoritesResult.created} creados, ${favoritesResult.existing} ya existían.`
  );

  await mongoose.connection.close();
  process.exit(0);
};

runSeed().catch(async (error) => {
  console.error('❌ Error corriendo el seed:', error.message);
  await mongoose.connection.close();
  process.exit(1);
});
