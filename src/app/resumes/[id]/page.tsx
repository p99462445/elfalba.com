import React from 'react';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import ResumeDetailClient from './ResumeDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ResumeDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Basic Auth Check
    if (!user) {
        redirect('/밤알바구인구직?error=unauthorized');
    }

    // 2. Detailed Auth Check (Ad Status)
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

    const isAdmin = dbUser?.role === 'ADMIN' || user.email === '1@gmail.com';
    const isEmployer = dbUser?.role === 'EMPLOYER';
    const hasAd = isEmployer && (dbUser?.employer?._count.jobs || 0) > 0;

    // Only Admin or Paying Employer can view details
    if (!isAdmin && !hasAd) {
        redirect('/밤알바구인구직?error=no-permission');
    }

    // 3. Fetch Data
    const resume = await prisma.resume.findUnique({
        where: { id },
        include: { 
            images: true,
            user: { select: { nickname: true } }
        }
    });

    if (!resume) return notFound();

    return (
        <main className="min-h-screen bg-white dark:bg-dark-bg pb-24">
            <ResumeDetailClient resume={resume} />
        </main>
    );
}
