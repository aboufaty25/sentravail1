// Demo data: `npm run seed`. Wipes demo accounts (phones +22177000xxxx) then recreates them.
const { connectDb, mongoose } = require('../src/config/db');
const User = require('../src/models/User');

const DEMO_PASSWORD = 'demo1234';

const demoUsers = [
  { name: 'Moussa Diop', role: 'worker', trades: ['macon'], city: 'pikine', neighborhood: 'Thiaroye', bio: 'Maçon depuis 12 ans : dalles, carrelage, crépissage. Travail propre et dans les délais.', availableToday: true, coords: [-17.392, 14.751] },
  { name: 'Awa Ndiaye', role: 'worker', trades: ['couturier'], city: 'dakar', neighborhood: 'Médina', bio: 'Couturière : boubous, taille-basse, tenues de mariage. Je couds aussi sur mesure pour enfants.', coords: [-17.449, 14.681] },
  { name: 'Ibrahima Fall', role: 'worker', trades: ['mecanicien', 'chauffeur'], city: 'thies', neighborhood: 'Grand Thiès', bio: 'Mécanicien auto (essence et diesel). Permis B et C, disponible pour des courses.', availableToday: true, coords: [-16.926, 14.791] },
  { name: 'Fatou Sow', role: 'worker', trades: ['coiffeur'], city: 'guediawaye', neighborhood: 'Golf Sud', bio: 'Coiffeuse : tresses, nattes, tissages. Je me déplace à domicile.', coords: [-17.399, 14.776] },
  { name: 'Cheikh Ba', role: 'worker', trades: ['electricien'], city: 'rufisque', neighborhood: 'Keury Kao', bio: 'Électricien bâtiment : installation, dépannage, compteurs Woyofal.', coords: [-17.273, 14.716] },
  { name: 'Mariama Diallo', role: 'worker', trades: ['cuisinier', 'menage'], city: 'dakar', neighborhood: 'Sacré-Cœur', bio: 'Cuisinière et aide ménagère, 8 ans d\'expérience en famille.', coords: [-17.468, 14.716] },
  { name: 'Ousmane Sarr', role: 'worker', trades: ['plombier'], city: 'pikine', neighborhood: 'Guinaw Rails', bio: 'Plombier : fuites, chauffe-eau, sanitaires. Intervention rapide.', availableToday: true, coords: [-17.405, 14.744] },
  { name: 'Abdou Kane', role: 'worker', trades: ['menuisier'], city: 'saint-louis', neighborhood: 'Sor', bio: 'Menuisier bois et alu : portes, fenêtres, meubles sur mesure.', coords: [-16.489, 16.026] },
  { name: 'Aminata Faye', role: 'recruiter', trades: [], city: 'dakar', neighborhood: 'Almadies', bio: 'Je cherche régulièrement des artisans de confiance pour mes chantiers.', coords: [-17.513, 14.745] },
  { name: 'Admin SenTravail', role: 'admin', trades: [], city: 'dakar', neighborhood: '', bio: 'Compte de modération.', coords: null },
];

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    throw new Error('Refusing to seed demo accounts in production (use --force if you really mean it)');
  }
  await connectDb();
  await User.syncIndexes();
  const removed = await User.deleteMany({ phone: /^\+22177000/ });
  console.log(`[seed] removed ${removed.deletedCount} demo users`);

  for (const [i, u] of demoUsers.entries()) {
    const phone = `+22177000${String(i + 1).padStart(4, '0')}`;
    const user = new User({
      name: u.name,
      phone,
      whatsapp: phone,
      role: u.role,
      trades: u.trades,
      city: u.city,
      neighborhood: u.neighborhood,
      bio: u.bio,
      availableToday: Boolean(u.availableToday),
      location: u.coords ? { type: 'Point', coordinates: u.coords } : undefined,
      isVerified: i < 2,
    });
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
    console.log(`[seed] ${u.role.padEnd(9)} ${phone}  ${u.name}`);
  }
  console.log(`[seed] done — password for every demo account: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
