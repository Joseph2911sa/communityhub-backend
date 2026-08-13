import mongoose from 'mongoose';

/**
 * Establece la conexión con MongoDB usando Mongoose.
 * La URI se obtiene de la variable de entorno MONGODB_URI.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI no está definida en las variables de entorno.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Error de conexión a MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado.');
    });
  } catch (error) {
    console.error(`❌ No fue posible conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
