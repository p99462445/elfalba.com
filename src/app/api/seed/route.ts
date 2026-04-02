import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
})
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

export async function GET() {
    try {
        // 1. Seed Regions
        const seoul = await prisma.region.upsert({
            where: { slug: 'seoul' },
            update: {},
            create: {
                name: '서울',
                slug: 'seoul',
                children: {
                    create: [
                        { name: '강남구', slug: 'seoul-gangnam' },
                        { name: '서초구', slug: 'seoul-seocho' },
                        { name: '마포구', slug: 'seoul-mapo' },
                    ]
                }
            }
        })

        const gyeonggi = await prisma.region.upsert({
            where: { slug: 'gyeonggi' },
            update: {},
            create: {
                name: '경기',
                slug: 'gyeonggi',
                children: {
                    create: [
                        { name: '수원시', slug: 'gyeonggi-suwon' },
                        { name: '성남시', slug: 'gyeonggi-seongnam' },
                    ]
                }
            }
        })

        const busan = await prisma.region.upsert({
            where: { slug: 'busan' },
            update: {},
            create: {
                name: '부산',
                slug: 'busan',
                children: {
                    create: [
                        { name: '해운대구', slug: 'busan-haeundae' },
                        { name: '서면', slug: 'busan-seomyeon' },
                        { name: '기장군', slug: 'busan-gijang' },
                    ]
                }
            }
        })

        // 2. Seed Job Categories
        const room = await prisma.jobCategory.upsert({
            where: { slug: 'room' },
            update: {},
            create: {
                name: '유흥알바',
                slug: 'room',
                children: {
                    create: [
                        { name: '룸싸롱/클럽', slug: 'room-salon' },
                        { name: '텐프로', slug: 'room-tenpro' },
                        { name: '쩜오', slug: 'room-15' },
                    ]
                }
            }
        })

        const karaoke = await prisma.jobCategory.upsert({
            where: { slug: 'karaoke' },
            update: {},
            create: {
                name: '노래방/주점',
                slug: 'karaoke',
                children: {
                    create: [
                        { name: '일반노래방', slug: 'karaoke-normal' },
                        { name: '모던바', slug: 'karaoke-bar' },
                        { name: '단란주점', slug: 'karaoke-danran' },
                        { name: '노래주점', slug: 'karaoke-jujeom' },
                    ]
                }
            }
        })

        const massage = await prisma.jobCategory.upsert({
            where: { slug: 'massage' },
            update: {},
            create: {
                name: '마사지/테라피',
                slug: 'massage',
                children: {
                    create: [
                        { name: '스웨디시', slug: 'massage-swedish' },
                        { name: '아로마', slug: 'massage-aroma' },
                    ]
                }
            }
        })

        return NextResponse.json({ message: 'Seed success', data: { seoul, gyeonggi, busan, room, karaoke, massage } })
    } catch (error: any) {
        console.error("SEED ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
