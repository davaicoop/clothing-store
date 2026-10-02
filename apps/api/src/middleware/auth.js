import { createHash } from 'node:crypto';
import { query } from '../db.js';
import { assert } from '../lib/errors.js';
import { config } from '../config.js';

export const hash = token => createHash('sha256').update(token).digest('hex');
export async function requireAdmin(req, _res, next) {
  const token = req.cookies.clothing_session;
  assert(token, 401, 'Please sign in to the admin area.');
  const { rows } = await query(`SELECT a.id,a.email,a.name,s.id AS session_id
    FROM admin_sessions s JOIN admins a ON a.id=s.admin_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND a.active=true`, [hash(token)]);
  assert(rows[0], 401, 'Your session expired. Please sign in again.');
  req.admin = rows[0];
  next();
}
export function protectMutations(req, _res, next) {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  assert(req.get('X-Requested-With') === 'clothing-store', 403, 'Request verification failed.');
  if (req.get('Origin')) assert(req.get('Origin') === config.origin, 403, 'This origin is not allowed.');
  next();
}
export const cookieOptions = { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 * 1000 };
