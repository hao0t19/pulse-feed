export const config = {
  httpPort: Number(process.env.HTTP_PORT ?? 8081),
  mongoUri:
    process.env.MONGODB_URI ??
    'mongodb://pulse_app:pulse_app_secret@localhost:27017/pulsefeed?authSource=pulsefeed',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  seedDemoData: (process.env.SEED_DEMO_DATA ?? 'true').toLowerCase() === 'true',
};
