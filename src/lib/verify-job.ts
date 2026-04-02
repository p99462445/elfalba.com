import prisma from './prisma'

const TARGET_EMAIL = '1@gmail.com'
const TARGET_ID = 'ce447324-7136-4132-87e8-d2cef511bcfe'

async function syncAndPost() {
    try {
        console.log('Synchronizing user in Prisma...')
        const user = await prisma.user.upsert({
            where: { id: TARGET_ID },
            update: { role: 'ADMIN' },
            create: {
                id: TARGET_ID,
                email: TARGET_EMAIL,
                role: 'ADMIN'
            },
            include: { employer: true }
        })

        let employerId = user.employer?.id
        if (!employerId) {
            console.log('Creating employer profile for user...')
            const employer = await prisma.employer.create({
                data: {
                    user_id: user.id,
                    business_name: '관리자 테스트점',
                    business_number: '000-00-00000',
                    verification_status: 'APPROVED'
                }
            })
            employerId = employer.id
        }

        console.log('User synced. Employer ID:', employerId)

        const region = await prisma.region.findFirst({ where: { slug: 'seoul-gangnam' } })
        const category = await prisma.jobCategory.findFirst({ where: { slug: 'room' } })

        if (!region || !category) {
            console.error('Region or Category seeds missing.')
            return
        }

        console.log('Posting job...')
        const job = await prisma.job.create({
            data: {
                title: '현장 실전 테스트 공고 (AI 직접 등록)',
                manager_name: '관리자베테랑',
                contact_info: '010-8888-8888',
                salary_type: 'TC',
                salary_amount: 15,
                salary_info: '티씨 15만원',
                description: '<p>시스템 검증을 위해 AI가 사장님 계정으로 직접 등록한 테스트 공고입니다. 보인다면 정상적으로 등록되는 상태입니다.</p>',
                status: 'PENDING',
                employer_id: employerId,
                category_id: category.id,
                regions: {
                    create: [
                        { region_id: region.id }
                    ]
                }
            }
        })

        console.log('SUCCESS: Job registered successfully! ID:', job.id)

    } catch (error) {
        console.error('FAILED:', error)
    } finally {
        await prisma.$disconnect()
    }
}

syncAndPost()
