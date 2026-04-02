import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        let notice = await prisma.resumeNotice.findFirst({
            orderBy: { updated_at: 'desc' }
        });

        if (!notice) {
            // Initial default notice
            notice = await prisma.resumeNotice.create({
                data: { content: '이력서 이용 규칙 및 안내 사항을 확인해 주세요.' }
            });
        }

        return NextResponse.json(notice);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check if Admin
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        });

        if (dbUser?.role !== 'ADMIN' && user.email !== '1@gmail.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { content } = await req.json();
        
        const notice = await prisma.resumeNotice.upsert({
            where: { id: 1 },
            update: { content },
            create: { id: 1, content }
        });

        return NextResponse.json(notice);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
