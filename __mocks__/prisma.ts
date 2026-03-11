// Provide a simple singleton of PrismaClient for mocking in tests
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
