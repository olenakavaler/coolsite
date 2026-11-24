import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await hash('password123', 10);

  // 1. Create or update test users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tusovka.ua' },
    update: {},
    create: {
      email: 'admin@tusovka.ua',
      name: 'Олена Організатор',
      passwordHash,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@tusovka.ua' },
    update: {},
    create: {
      email: 'user1@tusovka.ua',
      name: 'Тарас Розробник',
      passwordHash,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@tusovka.ua' },
    update: {},
    create: {
      email: 'user2@tusovka.ua',
      name: 'Марія Дизайнер',
      passwordHash,
    },
  });

  // 2. Upcoming Public Event with plenty of seats
  const upcomingEvent1 = await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      title: 'Мітап розробників: Next.js & AI',
      description: 'Обговорюємо найновіші тренди веб-розробки, архітектуру сучасних додатків та інтеграцію ШІ. Кава та печиво включені!',
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // in 7 days
      capacity: 50,
      visibility: 'PUBLIC',
      ownerId: admin.id,
    },
  });

  // 3. Upcoming Public Event with limited seats & registrations
  const upcomingEvent2 = await prisma.event.upsert({
    where: { id: 'seed-event-2' },
    update: {},
    create: {
      id: 'seed-event-2',
      title: 'Вечір настільних ігор у коворкінгу',
      description: 'Граємо в Catan, Dixit, Carcassonne та інші класні настілки. Приносьте улюблені ігри та гарний настрій!',
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
      capacity: 10,
      visibility: 'PUBLIC',
      ownerId: admin.id,
    },
  });

  // 4. Sold out upcoming event
  const soldOutEvent = await prisma.event.upsert({
    where: { id: 'seed-event-soldout' },
    update: {},
    create: {
      id: 'seed-event-soldout',
      title: 'Воркшоп з практичної безпеки вебзастосунків',
      description: 'Інтенсивний воркшоп з пошуку та закриття вразливостей IDOR, CSRF, XSS, та атак на автентифікацію.',
      startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      capacity: 2,
      visibility: 'PUBLIC',
      ownerId: admin.id,
    },
  });

  // 5. Past event (should NOT be on homepage)
  await prisma.event.upsert({
    where: { id: 'seed-event-past' },
    update: {},
    create: {
      id: 'seed-event-past',
      title: 'Минулий мітап: Введення у TypeScript',
      description: 'Подія, яка успішно відбулася минулого місяця.',
      startsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      capacity: 30,
      visibility: 'PUBLIC',
      ownerId: admin.id,
    },
  });

  // 6. Private event with secret token
  const privateToken = 'a1b2c3d4e5f6789012345678abcdef12';
  await prisma.event.upsert({
    where: { id: 'seed-event-private' },
    update: {},
    create: {
      id: 'seed-event-private',
      title: 'Закрита вечірка для друзів клубу',
      description: 'Секретна зустріч для своїх. Доступ лише за прямим посиланням.',
      startsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
      capacity: 15,
      visibility: 'PRIVATE',
      token: privateToken,
      ownerId: admin.id,
    },
  });

  // 7. Seed attendances
  await prisma.attendance.upsert({
    where: {
      eventId_userId: {
        eventId: upcomingEvent2.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      eventId: upcomingEvent2.id,
      userId: user1.id,
    },
  });

  await prisma.attendance.upsert({
    where: {
      eventId_userId: {
        eventId: soldOutEvent.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      eventId: soldOutEvent.id,
      userId: user1.id,
    },
  });

  await prisma.attendance.upsert({
    where: {
      eventId_userId: {
        eventId: soldOutEvent.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      eventId: soldOutEvent.id,
      userId: user2.id,
    },
  });

  // 8. Seed comments
  const existingComment = await prisma.comment.findFirst({
    where: { eventId: upcomingEvent1.id, userId: user1.id },
  });

  if (!existingComment) {
    await prisma.comment.create({
      data: {
        content: 'Дуже чекаю на цей мітап! Чи буде запис виступів?',
        eventId: upcomingEvent1.id,
        userId: user1.id,
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log('Test credentials:');
  console.log('  Admin/Owner: admin@tusovka.ua / password123');
  console.log('  User 1:      user1@tusovka.ua / password123');
  console.log('  User 2:      user2@tusovka.ua / password123');
  console.log(`  Private event URL: /e/${privateToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
