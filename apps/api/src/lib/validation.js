import { z } from 'zod';

export const uuid = z.string().uuid();
export const text = (max = 200) => z.string().trim().min(1).max(max);
export const phone = z.string().trim().transform(value => {
  const digits = value.replace(/[\s()+-]/g, '');
  return /^0[17]\d{8}$/.test(digits) ? `254${digits.slice(1)}` : digits;
}).pipe(z.string().regex(/^\d{9,15}$/, 'Enter a valid phone number including country code.'));
export const url = z.string().url().refine(value => /^https?:\/\//.test(value), 'Use an HTTP or HTTPS image URL.');
export const variantSchema = z.object({
  id: uuid.optional(), size: text(30), color: text(40), sku: text(80),
  stock: z.coerce.number().int().min(0).max(1000000),
  expectedStock: z.number().int().min(0).optional(),
});
export const productSchema = z.object({
  name: text(150), description: z.string().trim().max(5000).default(''),
  categoryId: uuid, audience: z.enum(['Men','Women','Unisex']).default('Unisex'),
  price: z.coerce.number().positive().max(10000000).transform(n => Math.round(n * 100) / 100),
  costPrice: z.coerce.number().nonnegative().max(10000000).nullable().optional(),
  images: z.array(url).min(1).max(12), active: z.boolean().default(true),
  featured: z.boolean().default(false), variants: z.array(variantSchema).min(1).max(100),
}).superRefine((value, ctx) => {
  const combinations = value.variants.map(v => `${v.size.toLowerCase()}/${v.color.toLowerCase()}`);
  const skus = value.variants.map(v => v.sku.toLowerCase());
  if (new Set(combinations).size !== combinations.length || new Set(skus).size !== skus.length) {
    ctx.addIssue({ code: 'custom', path: ['variants'], message: 'Each size/color and SKU must be unique.' });
  }
});
export const checkoutSchema = z.object({
  customer: z.object({ name: text(120), phone, email: z.union([z.string().email().max(200), z.literal('')]).optional() }),
  fulfilment: z.enum(['Delivery','Pickup']),
  town: z.string().trim().max(120).default(''), address: z.string().trim().max(500).default(''),
  instructions: z.string().trim().max(1000).default(''),
  paymentMethod: z.enum(['M-Pesa','Cash on Delivery','Pay on Pickup']),
  items: z.array(z.object({ variantId: uuid, quantity: z.number().int().min(1).max(99) })).min(1).max(50),
}).superRefine((value, ctx) => {
  if (value.fulfilment === 'Delivery' && (!value.town || !value.address)) {
    ctx.addIssue({ code: 'custom', message: 'Town and address are required for delivery.' });
  }
  if ((value.fulfilment === 'Delivery' && value.paymentMethod === 'Pay on Pickup') ||
      (value.fulfilment === 'Pickup' && value.paymentMethod === 'Cash on Delivery')) {
    ctx.addIssue({ code: 'custom', message: 'Choose a payment method for your delivery or pickup option.' });
  }
  if (new Set(value.items.map(i => i.variantId)).size !== value.items.length) {
    ctx.addIssue({ code: 'custom', message: 'Combine quantities for the same variant.' });
  }
});
export const settingsSchema = z.object({
  shopName: text(80), phone: z.union([phone, z.literal('')]), whatsapp: z.union([phone, z.literal('')]),
  email: z.union([z.string().email().max(200), z.literal('')]), location: text(300),
  deliveryFee: z.coerce.number().nonnegative().max(100000),
  currency: z.literal('KES'), currencySymbol: z.literal('KSh'),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),
  mpesaInstructions: z.string().trim().max(1000).default(''),
});
