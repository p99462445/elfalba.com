import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { name, phone } = await req.json()

        if (!name || !phone) {
            return NextResponse.json({ message: '이름과 휴대폰 번호를 모두 입력해주세요.' }, { status: 400 })
        }

        // Clean phone number (remove hyphens)
        const cleanPhone = phone.replace(/-/g, '')

        // Find user by real_name or nickname and phone
        // In this project, 'real_name' is from identity verification, or 'name' might be used.
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { real_name: name },
                    { name: name }
                ],
                phone: {
                    contains: cleanPhone
                },
                status: 'ACTIVE'
            },
            select: {
                email: true
            }
        })

        if (!user) {
            return NextResponse.json({ message: '입력하신 정보로 등록된 계정을 찾을 수 없습니다.' }, { status: 404 })
        }

        // Partially mask the email for security? Or just show it? 
        // Showing it as requested "아이디는못찾나" usually implies showing the email.
        return NextResponse.json({ email: user.email })

    } catch (error) {
        console.error('Find ID Error:', error)
        return NextResponse.json({ message: '처리 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
