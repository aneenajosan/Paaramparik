// scripts/update-backend-seed.js
const fs = require('fs');
const path = require('path');

const listings = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'listings.json'), 'utf8'));

const artFormMap = {
  'performing-arts': 'ArtForm.DANCE',
  'music-percussion': 'ArtForm.MUSIC',
  'visual-arts': 'ArtForm.VISUAL_ARTS',
  'crafts-textiles': 'ArtForm.CRAFTS',
  'festivals-rituals': 'ArtForm.TRADITIONAL_RITUAL_ARTS',
  'heritage-architecture': 'ArtForm.TRADITIONAL_RITUAL_ARTS',
};

const eventTypeMap = {
  'event': 'EventType.FESTIVAL',
  'performance': 'EventType.PERFORMANCE',
  'workshop': 'EventType.WORKSHOP',
  'place': 'EventType.HERITAGE_EVENT',
  'artist': 'EventType.CULTURAL_GATHERING',
  'practice': 'EventType.CULTURAL_GATHERING',
};

const seedItems = listings.map((l) => {
  const art = artFormMap[l.category_id] || 'ArtForm.OTHER';
  const evType = eventTypeMap[l.listing_type] || 'EventType.FESTIVAL';
  const dateStr = l.event_start || '2026-11-20';
  const parts = (l.location_name || '').split(',');
  const locality = parts[0]?.trim() || l.district || 'Heritage Centre';
  const neighborhood = parts.length > 2 ? parts[1]?.trim() : l.district || 'Cultural Zone';
  const isFree = !l.participation_info || l.participation_info.toLowerCase().includes('free');

  return `  {
    id: ${JSON.stringify(l.id)},
    title: ${JSON.stringify(l.title)},
    description: ${JSON.stringify(l.description)},
    culturalBackground: ${JSON.stringify(l.cultural_background || l.description)},
    artForm: ${art},
    eventType: ${evType},
    locality: ${JSON.stringify(locality)},
    neighborhood: ${JSON.stringify(neighborhood)},
    latitude: ${l.latitude},
    longitude: ${l.longitude},
    eventDate: new Date('${dateStr}T10:00:00Z'),
    startTime: ${JSON.stringify(l.event_start_time || '10:00')},
    endTime: ${JSON.stringify(l.event_end_time || '20:00')},
    costType: ${isFree ? 'CostType.FREE' : 'CostType.PAID'},
    verificationStatus: VerificationStatus.VERIFIED,
    publicationStatus: PublicationStatus.PUBLISHED,
    organizerName: ${JSON.stringify(l.practitioner_name || 'Paaramparik Cultural Trust')},
    organizerContact: 'contact@paaramparik.culture',
    sourceUrl: ${JSON.stringify(l.sources?.[0]?.source_url || 'https://en.wikipedia.org')},
  }`;
});

const fileContent = `import { PrismaClient, ArtForm, EventType, CostType, VerificationStatus, PublicationStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const seedEvents = [
${seedItems.join(',\n')}
];

export async function main() {
  console.log('Seeding Paaramparik database with authentic nationwide cultural events...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@livingculturemap.org' },
    update: {},
    create: {
      email: 'admin@livingculturemap.org',
      password: hashedPassword,
      name: 'Culture Admin',
      role: UserRole.ADMIN,
    },
  });
  console.log('Admin user verified:', adminUser.email);

  // Seed events
  for (const event of seedEvents) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: event,
      create: event,
    });
  }

  console.log(\`Successfully seeded \${seedEvents.length} events across Indian states!\`);
}

if (process.env.NODE_ENV !== 'test') {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'backend', 'prisma', 'seed.ts'), fileContent, 'utf8');
console.log('Successfully updated backend/prisma/seed.ts with', seedItems.length, 'events across all states!');
