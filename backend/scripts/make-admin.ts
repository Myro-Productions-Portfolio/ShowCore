import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'pmnicolasm@gmail.com'
  
  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`User ${email} not found. Creating admin user...`)
    user = await prisma.user.create({
      data: {
        email,
        emailVerified: true,
        role: 'ADMIN',
      },
    })
    console.log(`✅ Admin user created: ${user.email} (${user.role})`)
  } else {
    console.log(`User found: ${user.email} (current role: ${user.role})`)
    
    if (user.role === 'ADMIN') {
      console.log('✅ User is already an admin!')
    } else {
      // Update to admin
      user = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      })
      console.log(`✅ User updated to ADMIN: ${user.email}`)
    }
  }

  console.log('\nUser details:')
  console.log(`  ID: ${user.id}`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Role: ${user.role}`)
  console.log(`  Email Verified: ${user.emailVerified}`)
  console.log(`  Created: ${user.createdAt}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
