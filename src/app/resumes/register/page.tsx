import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import ResumeFormClient from './ResumeFormClient';

export default async function ResumeRegisterPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?returnUrl=/밤알바구인구직/등록');
    }

    // Role Check: Only personal members can write
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (dbUser?.role === 'EMPLOYER') {
        redirect('/밤알바구인구직?error=personal-only');
    }

    // Fetch existing resume if any
    const resume = await prisma.resume.findUnique({
        where: { user_id: user.id },
        include: { images: true }
    });

    // Fetch metadata for selects
    const regions = await prisma.region.findMany({
        where: { parent_id: 162 }, // Seoul sub-regions for now, or fetch all parents
        orderBy: { id: 'asc' }
    });

    const categories = await prisma.jobCategory.findMany({
        where: { parent_id: null },
        orderBy: { id: 'asc' }
    });

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24">
            <ResumeFormClient 
                initialData={resume} 
                regions={regions.map(r => r.name)} 
                categories={categories.map(c => c.name)} 
            />
        </main>
    );
}
