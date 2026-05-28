import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      maxPoolSize: 10,
    });
    console.log('[db]: Connected successfully to MongoDB');
  } catch (error) {
    console.error('[db]: MongoDB connection error:', error);
    process.exit(1);
  }
}
