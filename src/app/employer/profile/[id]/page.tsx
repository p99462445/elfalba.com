import React from 'react'
import Link from 'next/link'
import { MapPin, Phone, Briefcase, ArrowLeft, Star, ExternalLink } from 'lucide-react'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { buildJobSeoUrl } from '@/lib/seoUrls'

export default async function EmployerPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const employer = await prisma.employer.findUnique({
        where: { id },
        include: {
            jobs: {
                where: { status: 'ACTIVE' },
                include: { region: true, category: true },
                orderBy: { last_jumped_at: 'desc' }
            }
        }
    })

    if (!employer) notFound()

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-800 dark:text-gray-200 font-sans pb-20">
            {/* Header */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-black/60 border-b border-gray-100 dark:border-white/5 px-6 h-16 flex items-center justify-between">
                <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition text-gray-400 dark:text-gray-200">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500">Official Profile</h1>
                <div className="w-10"></div>
            </nav>

            <main className="max-w-xl mx-auto px-4 mt-10">
                {/* Brand Header */}
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-rose-600 dark:from-purple-600 dark:to-indigo-600 rounded-[40px] mx-auto mb-6 flex items-center justify-center text-white shadow-2xl shadow-amber-500/20 dark:shadow-purple-500/20">
                        <Briefcase size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase mb-2">{employer.business_name}</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center justify-center gap-1">
                        <MapPin size={12} /> {employer.address || 'Location Hidden'}
                    </p>
                </div>

                {/* About Info */}
                <section className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[40px] p-8 mb-10">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Representative</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{employer.owner_name || 'Verified Partner'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Status</p>
                            <p className="text-sm font-bold text-green-500 dark:text-green-400">APPROVED</p>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Shop Introduction</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {employer.business_name}은(는) 프리미엄 서비스를 제공하는 검증된 업소입니다.
                            안정적인 고수익과 최상의 근무 환경을 약속드립니다.
                        </p>
                    </div>
                </section>

                {/* Active Jobs */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Recruitment</h3>
                        <span className="text-[10px] font-bold text-gray-600 italic">{employer.jobs.length} Posts</span>
                    </div>

                    <div className="space-y-3">
                        {employer.jobs.map((job: any) => (
                            <Link key={job.id} href={buildJobSeoUrl(job)} className="group flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl hover:border-amber-500/30 dark:hover:border-purple-500/30 transition shadow-sm hover:shadow-amber-500/5 dark:hover:shadow-purple-500/5">
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-500 dark:bg-purple-600 text-white rounded uppercase">{job.exposure_level}</span>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{job.region?.name || '기타'}</p>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white">{job.title}</h4>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-black text-amber-500 dark:text-indigo-400">{job.salary_info}</p>
                                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-700 ml-auto mt-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}

function ChevronRight({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
