// Creates application user (runs once on fresh volume).
const dbName = process.env.MONGO_INITDB_DATABASE || 'pulsefeed';
const appUser = process.env.MONGO_APP_USER || 'pulse_app';
const appPass = process.env.MONGO_APP_PASSWORD || 'pulse_app_secret';

db = db.getSiblingDB(dbName);
db.createUser({
  user: appUser,
  pwd: appPass,
  roles: [{ role: 'readWrite', db: dbName }],
});
