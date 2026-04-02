import prisma from './prisma'

async function updateCategories() {
    try {
        console.log('UPDATING CATEGORIES...')

        // Update '마사지' (massage) to '아로마' (aroma)
        const massage = await prisma.jobCategory.updateMany({
            where: { slug: 'massage' },
            data: { name: '아로마', slug: 'aroma' }
        })
        console.log('Update massage to aroma:', massage.count)

        // Update '기타촬영' (etc) to '기타' (etc)
        const etc = await prisma.jobCategory.updateMany({
            where: { slug: 'etc' },
            data: { name: '기타' }
        })
        console.log('Update etc name to 기타:', etc.count)

        console.log('DB UPDATE SUCCESS')
    } catch (e) {
        console.error('DB UPDATE ERROR:', e)
    } finally {
        await prisma.$disconnect()
    }
}

updateCategories()
