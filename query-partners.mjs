import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const partners = await prisma.partner.findMany({ select: { id: true, name: true }, take: 5 });
console.log(JSON.stringify(partners, null, 2));
await prisma.$disconnect();
