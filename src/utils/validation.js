const { z } = require('zod');
const { normalizeSenegalPhone } = require('./phone');
const { TRADE_SLUGS } = require('../config/trades');
const { CITY_SLUGS } = require('../config/cities');

const phoneField = z
  .string({ error: 'Numéro obligatoire' })
  .trim()
  .transform((v, ctx) => {
    const n = normalizeSenegalPhone(v);
    if (!n) {
      ctx.addIssue({ code: 'custom', message: 'Numéro sénégalais invalide (ex. 77 123 45 67)' });
      return z.NEVER;
    }
    return n;
  });

const optionalPhoneField = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = normalizeSenegalPhone(v);
    if (!n) {
      ctx.addIssue({ code: 'custom', message: 'Numéro WhatsApp invalide' });
      return z.NEVER;
    }
    return n;
  });

const passwordField = z
  .string({ error: 'Mot de passe obligatoire' })
  .min(6, 'Au moins 6 caractères')
  .max(100, 'Trop long');

// HTML forms send a single string for one checkbox and an array for several.
const tradesField = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]))
  .pipe(z.array(z.enum(TRADE_SLUGS, { error: 'Métier inconnu' })).max(3, '3 métiers maximum'));

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(60, 'Nom trop long'),
  phone: phoneField,
  password: passwordField,
  role: z.enum(['worker', 'recruiter'], { error: 'Choisis un type de compte' }),
});

const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, 'Mot de passe obligatoire'),
});

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(60, 'Nom trop long'),
  bio: z.string().trim().max(500, '500 caractères maximum').optional().default(''),
  trades: tradesField,
  city: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || '')
    .refine((v) => v === '' || CITY_SLUGS.includes(v), 'Ville inconnue'),
  neighborhood: z.string().trim().max(60, 'Quartier trop long').optional().default(''),
  whatsapp: optionalPhoneField,
});

// Returns { data } or { errors: { field: message } }.
function parse(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] || '_form';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { errors };
}

module.exports = { registerSchema, loginSchema, profileSchema, parse };
