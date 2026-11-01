const { slugify } = require('../utils/slugify');

// Phase 1 trades. `slug` is the stable identifier stored in the database.
const TRADES = [
  { slug: 'macon', label: 'Maçon', icon: '🧱' },
  { slug: 'plombier', label: 'Plombier', icon: '🚰' },
  { slug: 'electricien', label: 'Électricien', icon: '💡' },
  { slug: 'menuisier', label: 'Menuisier', icon: '🪚' },
  { slug: 'couturier', label: 'Couturier / Couturière', icon: '🧵' },
  { slug: 'coiffeur', label: 'Coiffeur / Coiffeuse', icon: '💇' },
  { slug: 'mecanicien', label: 'Mécanicien', icon: '🔧' },
  { slug: 'chauffeur', label: 'Chauffeur', icon: '🚗' },
  { slug: 'cuisinier', label: 'Cuisinier / Cuisinière', icon: '🍲' },
  { slug: 'menage', label: 'Femme / Homme de ménage', icon: '🧹' },
];

const TRADE_SLUGS = TRADES.map((t) => t.slug);
const tradeBySlug = Object.fromEntries(TRADES.map((t) => [t.slug, t]));

function tradeLabel(slug) {
  return tradeBySlug[slug] ? tradeBySlug[slug].label : slug;
}

// Sanity check: slugs must be URL-safe (used in /metier/:slug/:ville).
for (const t of TRADES) {
  if (slugify(t.slug) !== t.slug) throw new Error(`Invalid trade slug: ${t.slug}`);
}

module.exports = { TRADES, TRADE_SLUGS, tradeBySlug, tradeLabel };
