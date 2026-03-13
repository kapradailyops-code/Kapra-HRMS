const { PrismaClient } = require('@prisma/client')

async function check() {
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@kaprahrms.com' }
    })
    console.log('User found:', user ? 'YES' : 'NO')
    if (user) {
      console.log('Role:', user.role)
      console.log('Hash length:', user.passwordHash ? user.passwordHash.length : 'N/A')
    }
  } catch (e) {
    console.error('Error connecting to DB:', e)
  } finally {
    await prisma.$disconnect()
  }
}

check()
