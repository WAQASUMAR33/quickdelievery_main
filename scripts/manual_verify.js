const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'testuser_final_1@example.com'
    try {
        const user = await prisma.users.findFirst({
            where: { email: email }
        })

        if (!user) {
            console.log(`User ${email} not found.`)
            return
        }

        const updatedUser = await prisma.users.update({
            where: { id: user.id },
            data: { emailVerification: true }
        })

        console.log(`Successfully verified user: ${updatedUser.email}`)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
