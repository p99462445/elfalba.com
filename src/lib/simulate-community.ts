import prisma from './prisma'

const ADMIN_ID = 'ce447324-7136-4132-87e8-d2cef511bcfe' // 1@gmail.com (ADMIN)
const FEMALE_USER_ID = 'test-female-user-001'
const EMPLOYER_USER_ID = 'test-employer-user-001'

async function simulateCommunity() {
    try {
        console.log('--- Community Simulation Start ---')

        // 1. Ensure Admin exists and is Female (just in case, though Admin bypasses)
        await prisma.user.update({
            where: { id: ADMIN_ID },
            data: { role: 'ADMIN', gender: 'FEMALE' }
        })

        // 2. Create Female User
        console.log('Creating Female User...')
        const femaleUser = await prisma.user.upsert({
            where: { id: FEMALE_USER_ID },
            update: { role: 'USER', gender: 'FEMALE' },
            create: {
                id: FEMALE_USER_ID,
                email: 'female-test@example.com',
                nickname: '진이',
                role: 'USER',
                gender: 'FEMALE'
            }
        })

        // 3. Create Employer User with Community Pass
        console.log('Creating Employer with Pass...')
        const employerUser = await prisma.user.upsert({
            where: { id: EMPLOYER_USER_ID },
            update: {
                role: 'EMPLOYER',
                employer: {
                    upsert: {
                        create: {
                            business_name: '테스트 업소',
                            community_pass_expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days pass
                        },
                        update: {
                            community_pass_expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
                        }
                    }
                }
            },
            create: {
                id: EMPLOYER_USER_ID,
                email: 'employer-test@example.com',
                nickname: '김사장',
                role: 'EMPLOYER',
                employer: {
                    create: {
                        business_name: '테스트 업소',
                        community_pass_expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
                    }
                }
            }
        })

        // 4. Admin creates a post
        console.log('Admin creating post...')
        const post = await prisma.post.create({
            data: {
                user_id: ADMIN_ID,
                title: '커뮤니티 이용 수칙 및 안내',
                content: '<p>우리 커뮤니티는 서로 배려하는 공간입니다. 비방이나 욕설은 금지됩니다.</p>'
            }
        })
        console.log('Post created ID:', post.id)

        // 5. Female User comments
        console.log('Female user commenting...')
        await prisma.comment.create({
            data: {
                post_id: post.id,
                user_id: femaleUser.id,
                content: '안내 감사합니다! 깨끗하게 이용할게요.'
            }
        })

        // 6. Employer comments
        console.log('Employer commenting...')
        await prisma.comment.create({
            data: {
                post_id: post.id,
                user_id: employerUser.id,
                content: '업소 회원들도 잘 협조하겠습니다.'
            }
        })

        // 7. Verification
        console.log('--- Verification ---')
        const finalPost = await prisma.post.findUnique({
            where: { id: post.id },
            include: {
                _count: { select: { comments: true } },
                comments: { include: { user: { select: { nickname: true, role: true } } } }
            }
        })

        console.log('Post Title:', finalPost?.title)
        console.log('Total Comments:', finalPost?._count.comments)
        finalPost?.comments.forEach((c, i) => {
            console.log(`Comment ${i + 1} by ${c.user.nickname} (${c.user.role}): ${c.content}`)
        })

        console.log('Simulation Success!')

    } catch (error) {
        console.error('Simulation Failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

simulateCommunity()
