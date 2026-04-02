import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.notice.createMany({
        data: [
            {
                title: '[필독] 악녀알바 오픈을 환영합니다! 🎉',
                content: `안녕하세요, 악녀알바입니다.\n\n구직자와 구인자 모두가 안심하고 이용할 수 있는 매너 구인구직 No.1 플랫폼 악녀알바가 정식으로 오픈했습니다.\n\n[ 주요 특징 ]\n1. 철저한 본인인증을 통한 안심 구직 환경 조성\n2. 직관적이고 편리한 UI 제공\n3. 구인자와 구직자간 안전한 매칭 지원\n\n앞으로도 더 나은 서비스를 제공하기 위해 노력하겠습니다. 감사합니다.`,
                is_important: true,
                view_count: 0
            },
            {
                title: '[안내] 안전한 구직 활동을 위한 가이드',
                content: `회원 여러분의 안전한 구직 활동을 위해 다음 사항을 꼭 확인해 주세요.\n\n1. 면접 시 안전한 오픈된 장소를 이용해 주세요.\n2. 과도한 개인정보를 요구하는 경우 주의가 필요합니다.\n3. 연락처 공유 전 충분한 대화를 나누시길 권장합니다.\n\n악녀알바는 항상 회원님들의 권익 보호를 위해 앞장서겠습니다.`,
                is_important: false,
                view_count: 0
            }
        ]
    })
    console.log('Notices added successfully!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
