require('dotenv').config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/sugar_erp'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    accessTtl: process.env.JWT_ACCESS_TTL || '30m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  seed: {
    superAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@sugarfactory.com',
    superAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin@12345',
  },
};

if (env.nodeEnv === 'production') {
  const weak = ['dev-access-secret-change-me', 'dev-refresh-secret-change-me'];
  if (weak.includes(env.jwt.accessSecret) || weak.includes(env.jwt.refreshSecret)) {
    throw new Error('Refusing to start in production with default JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.');
  }
}

module.exports = env;
