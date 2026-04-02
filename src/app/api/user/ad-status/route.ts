import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ isActive: false, role: 'GUEST' });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { 
                role: true,
                employer: {
                    select: { 
                        _count: {
                            select: { 
                                jobs: {
                                    where: {
                                        status: 'ACTIVE',
                                        exposure_level: { in: ['VVIP', 'VIP'] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (dbUser?.role === 'ADMIN' || user.email === '1@gmail.com') {
            return NextResponse.json({ isActive: true, role: 'ADMIN' });
        }

        if (dbUser?.role === 'EMPLOYER') {
            const adCount = dbUser.employer?._count.jobs || 0;
            return NextResponse.json({ 
                isActive: adCount > 0, 
                role: 'EMPLOYER',
                jobCount: adCount
            });
        }

        return NextResponse.json({ isActive: false, role: 'USER' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
