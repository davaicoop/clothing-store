import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { ZodError } from 'zod';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { query } from './db.js';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { storeRouter } from './routes/store.js';
import { productsRouter } from './routes/admin-products.js';
import { inventoryRouter } from './routes/admin-inventory.js';
import { ordersRouter } from './routes/admin-orders.js';
import { reportsRouter } from './routes/admin-reports.js';
import { protectMutations,requireAdmin } from './middleware/auth.js';

export const app=express();
app.disable('x-powered-by');
if(config.production) app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:{directives:{'img-src':["'self'",'https:','data:'],
  'font-src':["'self'",'https://fonts.gstatic.com'], 'style-src':["'self'","'unsafe-inline'",'https://fonts.googleapis.com']}}}));
app.use(express.json({limit:'256kb'}));
app.use(cookieParser());
app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.get('/api/health',async(_req,res)=>{
  try {await query('SELECT 1');res.json({status:'ok',database:config.embedded?'embedded-postgresql-development':'postgresql'});}
  catch {res.status(503).json({status:'unavailable',database:'unavailable'});}
});
app.use('/api',rateLimit({windowMs:60*1000,limit:150,standardHeaders:'draft-8',legacyHeaders:false,
  message:{error:'Too many requests. Please try again shortly.'}}),protectMutations);
app.use('/api/auth',authRouter);
app.use('/api',storeRouter);
app.use('/api/admin',requireAdmin,productsRouter,inventoryRouter,ordersRouter,reportsRouter);
app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found.'}));
const dist=fileURLToPath(new URL('../../web/dist/',import.meta.url));
if(existsSync(dist)) {
  app.use(express.static(dist,{index:false}));
  app.get('/{*path}',(_req,res)=>res.sendFile(`${dist}/index.html`));
}
app.use((error,_req,res,_next)=>{
  if(error instanceof ZodError) return res.status(400).json({error:error.issues.map(i=>i.message).join(' ')});
  if(error.code==='23505') return res.status(409).json({error:'That SKU or category already exists. Use a unique value.'});
  if(error.code==='23503') return res.status(400).json({error:'A referenced item no longer exists. Refresh and try again.'});
  if(error.type==='entity.parse.failed') return res.status(400).json({error:'Invalid JSON body.'});
  const status=error.status || 500;
  if(status>=500) console.error('Request failed:',error.code||error.name,error.message);
  res.status(status).json({error:status>=500?'Something went wrong. Please try again.':error.message});
});
