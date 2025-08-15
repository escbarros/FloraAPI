import { PrismaClient } from '../generated/prisma';
import wordsDictionary from '../words_dictionary.json';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const wordsArray = Object.keys(wordsDictionary).map((word) => ({ word }));
  await prisma.words.createMany({ data: wordsArray, skipDuplicates: true });
  console.log('Seeding completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
