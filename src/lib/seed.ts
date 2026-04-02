import prisma from './prisma'

async function main() {
    try {
        console.log('Checking existing data...')

        const regionCount = await prisma.region.count()
        if (regionCount > 0) {
            console.log('Clearing old regional data...')
            await prisma.jobRegion.deleteMany({})
            await prisma.region.deleteMany({})
        }

        // JobCategory는 Job에 묶여있어 삭제 실패할 수 있으므로 삭제하지 않음.

        console.log('Seeding regions according to new hierarchy...')

        // 1. 서울 (Seoul)
        await prisma.region.create({
            data: {
                name: '서울',
                slug: 'seoul',
                children: {
                    create: [
                        { name: '강남', slug: 'seoul-gangnam' },
                        { name: '서초/송파', slug: 'seoul-seocho-songpa' },
                        { name: '강북/도봉/노원', slug: 'seoul-gangbuk-dobong-nowon' },
                        { name: '종로/용산/중구', slug: 'seoul-jongno-yongsan-jung-gu' },
                        { name: '강서/양천/영등포', slug: 'seoul-gangseo-yangcheon-yeongdeungpo' },
                        { name: '구로/금천/관악/동작', slug: 'seoul-guro-geumcheon-gwanak-dongjak' },
                        { name: '마포/은평/서대문', slug: 'seoul-mapo-eunpyeong-seodaemun' },
                        { name: '성북/성동/동대문', slug: 'seoul-seongbuk-seongdong-dongdaemun' },
                        { name: '강동/광진/중랑', slug: 'seoul-gangdong-gwangjin-jungnang' },
                    ]
                }
            }
        })

        // 2. 인천/경기 (Incheon/Gyeonggi)
        await prisma.region.create({
            data: {
                name: '인천/경기',
                slug: 'incheon-gyeonggi',
                children: {
                    create: [
                        { name: '인천/부천/시흥', slug: 'incheon-bucheon-siheung' },
                        { name: '수원/화성/오산', slug: 'suwon-hwaseong-osan' },
                        { name: '성남/용인/광주', slug: 'seongnam-yongin-gwangju' },
                        { name: '일산/김포/고양/파주', slug: 'ilsan-gimpo-goyang-paju' },
                        { name: '안산/군포/안양/의왕/광명', slug: 'ansan-gunpo-anyang-uiwang-gwangmyeong' },
                        { name: '의정부/양주/포천/동두천', slug: 'uijeongbu-yangju-pocheon-dongducheon' },
                        { name: '구리/남양주/하남', slug: 'guri-namyangju-hanam' },
                        { name: '평택/안성/이천/여주', slug: 'pyeongtaek-anseong-icheon-yeoju' },
                    ]
                }
            }
        })

        // 3. 대전/세종/충청
        await prisma.region.create({
            data: {
                name: '대전/세종/충청',
                slug: 'daejeon-sejong-chungcheong',
                children: {
                    create: [
                        { name: '대전/세종', slug: 'daejeon-sejong' },
                        { name: '청주/진천/충주/제천', slug: 'cheongju-jincheon-chungju-jecheon' },
                        { name: '천안/아산/공주/논산', slug: 'cheonan-asan-gongju-nonsan' },
                        { name: '서산/당진', slug: 'seosan-dangjin' },
                    ]
                }
            }
        })

        // 4. 대구/경북
        await prisma.region.create({
            data: {
                name: '대구/경북',
                slug: 'daegu-gyeongbuk',
                children: {
                    create: [
                        { name: '대구', slug: 'daegu' },
                        { name: '구미/김천/경산/영천', slug: 'gumi-gimcheon-gyeongsan-yeongcheon' },
                        { name: '경주/포항', slug: 'gyeongju-pohang' },
                        { name: '상주/문경/영주/안동', slug: 'sangju-mungyeong-yeongju-andong' },
                    ]
                }
            }
        })

        // 5. 부산/울산/경남
        await prisma.region.create({
            data: {
                name: '부산/울산/경남',
                slug: 'busan-ulsan-gyeongnam',
                children: {
                    create: [
                        { name: '부산', slug: 'busan' },
                        { name: '울산', slug: 'ulsan' },
                        { name: '창원/김해/양산', slug: 'changwon-gimhae-yangsan' },
                        { name: '진주/거제/통영', slug: 'jinju-geoje-tongyeong' },
                    ]
                }
            }
        })

        // 6. 광주/전라
        await prisma.region.create({
            data: {
                name: '광주/전라',
                slug: 'gwangju-jeolla',
                children: {
                    create: [
                        { name: '광주', slug: 'gwangju' },
                        { name: '여수/순천/광양/목포', slug: 'yeosu-suncheon-gwangyang-mokpo' },
                        { name: '전주/익산/김제/군산', slug: 'jeonju-iksan-gimje-gunsan' },
                    ]
                }
            }
        })

        // 7. 제주/강원
        await prisma.region.create({
            data: {
                name: '제주/강원',
                slug: 'jeju-gangwon',
                children: {
                    create: [
                        { name: '제주/서귀포', slug: 'jeju-seogwipo' },
                        { name: '속초/강릉/동해', slug: 'sokcho-gangneung-donghae' },
                        { name: '춘천/원주/정선/태백', slug: 'chuncheon-wonju-jeongseon-taebaek' },
                    ]
                }
            }
        })

        console.log('Checking job categories...')
        const categories = [
            { name: '룸', slug: 'room' },
            { name: '노래주점', slug: 'karaoke' },
            { name: '텐프로/쩜오', slug: 'tenpro' },
            { name: '바/카페', slug: 'bar' },
            { name: '아로마', slug: 'aroma' },
            { name: '기타촬영', slug: 'etc' },
        ]

        for (const cat of categories) {
            const exists = await prisma.jobCategory.findUnique({ where: { slug: cat.slug } })
            if (!exists) {
                await prisma.jobCategory.create({
                    data: { name: cat.name, slug: cat.slug }
                })
            }
        }

        console.log('Seed success!')
    } catch (error) {
        console.error('Seed error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
