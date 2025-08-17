import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('fetching words dictionary...');
  const response = await fetch(
    'https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_dictionary.json',
  );

  if (!response.ok) {
    throw new Error(`failed to download dictionary: ${response.statusText}`);
  }
  console.log('downloading words dictionary...');
  const wordsDictionary = (await response.json()) as Record<string, unknown>;

  const wordsArray = Object.keys(wordsDictionary).map((word) => ({ word }));

  await prisma.words.createMany({ data: wordsArray, skipDuplicates: true });

  console.log('seeding completed');
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
