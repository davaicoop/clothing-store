import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { query } from '../db.js';
import { assert } from '../lib/errors.js';
import { requireAdmin, cookieOptions, hash } from '../middleware/auth.js';

export const authRouter = Router();
authRouter.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' } }), async (req, res) => {
  const body = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) }).parse(req.body);
  const { rows } = await query('SELECT * FROM admins WHERE email=$1 AND active=true', [body.email.toLowerCase()]);
  const admin = rows[0];
  // Equal-cost comparison also runs for an unknown email.
  const valid = await bcrypt.compare(body.password, admin?.password_hash || '$2b$12$NlSaROw/YgCQliPEl6RJJe9DrM/wiwwhbHKvKstSjeh9M.isYZJCm');
  assert(admin && valid, 401, 'Email or password is incorrect.');
  const token = randomBytes(32).toString('hex');
  await query('DELETE FROM admin_sessions WHERE expires_at<now()');
  await query("INSERT INTO admin_sessions(admin_id,token_hash,expires_at) VALUES($1,$2,now()+interval '8 hours')", [admin.id,hash(token)]);
  res.cookie('clothing_session', token, cookieOptions);
  res.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
});
authRouter.get('/me', requireAdmin, (req, res) => res.json({ admin: { id: req.admin.id, name: req.admin.name, email: req.admin.email } }));
authRouter.post('/logout', requireAdmin, async (req, res) => {
  await query('DELETE FROM admin_sessions WHERE id=$1', [req.admin.session_id]);
  res.clearCookie('clothing_session', { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});
authRouter.post('/password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = z.object({ currentPassword: z.string().max(200), newPassword: z.string().min(12).max(200) }).parse(req.body);
  const { rows } = await query('SELECT password_hash FROM admins WHERE id=$1', [req.admin.id]);
  assert(await bcrypt.compare(currentPassword, rows[0].password_hash), 400, 'Current password is incorrect.');
  await query('UPDATE admins SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(newPassword,12),req.admin.id]);
  await query('DELETE FROM admin_sessions WHERE admin_id=$1', [req.admin.id]);
  res.clearCookie('clothing_session', { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});
