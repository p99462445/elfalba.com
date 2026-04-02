import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const resumes = await prisma.resume.findMany({
            include: { 
                images: true,
                user: {
                    select: { nickname: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Mapping to match the "Card" requirements
        const list = resumes.map(r => ({
            id: r.id,
            nickname: r.nickname || r.user?.nickname || '회원',
            age: r.age,
            region: r.region,
            occupation: r.occupation,
            content: r.content,
            thumbnail: r.images?.[0]?.image_url || null,
            created_at: r.created_at
        }));

        return NextResponse.json(list);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { nickname, age, region, occupation, content, images } = body;

        // Upsert resume (1 user = 1 resume)
        const resume = await prisma.resume.upsert({
            where: { user_id: user.id },
            update: {
                nickname,
                age: Number(age),
                region,
                occupation,
                content,
                updated_at: new Date()
            },
            create: {
                user_id: user.id,
                nickname,
                age: Number(age),
                region,
                occupation,
                content
            }
        });

        // Handle Images
        if (images && Array.isArray(images)) {
            // Simple approach: delete old and add new
            await prisma.resumeImage.deleteMany({ where: { resume_id: resume.id } });
            await prisma.resumeImage.createMany({
                data: images.map(url => ({
                    resume_id: resume.id,
                    image_url: url
                }))
            });
        }

        return NextResponse.json({ success: true, resume });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
