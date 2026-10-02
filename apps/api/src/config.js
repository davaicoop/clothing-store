const production = process.env.NODE_ENV === 'production';
const secret = process.env.SESSION_SECRET || (production ? '' : 'local-development-secret-replace-before-deploy-2026');
if (secret.length < 32 || (production && secret.includes('change-this'))) {
  throw new Error('SESSION_SECRET must contain at least 32 random characters.');
}
if (production && process.env.USE_EMBEDDED_DB === 'true') {
  throw new Error('Production requires managed PostgreSQL through DATABASE_URL.');
}
if (production && !process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in production.');
if (production && !process.env.APP_ORIGIN) throw new Error('APP_ORIGIN is required in production.');

export const config = {
  production,
  port: Number(process.env.PORT || 5000),
  secret,
  origin: process.env.APP_ORIGIN || 'http://localhost:5173',
  embedded: process.env.USE_EMBEDDED_DB === 'true',
  adminEmail: process.env.ADMIN_EMAIL || (!production ? 'admin@clothing.local' : ''),
  adminPassword: process.env.ADMIN_PASSWORD || (!production ? 'ChangeMe!2026' : ''),
};
