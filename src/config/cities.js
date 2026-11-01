const { slugify } = require('../utils/slugify');

// Main Senegalese cities / communes. Slugs are used in SEO URLs.
const CITY_NAMES = [
  'Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Keur Massar', 'Thiès', 'Mbour',
  'Saint-Louis', 'Kaolack', 'Touba', 'Diourbel', 'Louga', 'Ziguinchor',
  'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Matam', 'Sédhiou',
];

const CITIES = CITY_NAMES.map((name) => ({ slug: slugify(name), name }));
const CITY_SLUGS = CITIES.map((c) => c.slug);
const cityBySlug = Object.fromEntries(CITIES.map((c) => [c.slug, c]));

function cityName(slug) {
  return cityBySlug[slug] ? cityBySlug[slug].name : slug;
}

module.exports = { CITIES, CITY_SLUGS, cityBySlug, cityName };
