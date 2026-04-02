'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MessageSquare, MapPin, Briefcase, Calendar } from 'lucide-react';

interface Resume {
    id: string;
    nickname: string | null;
    age: number | null;
    region: string | null;
    occupation: string | null;
    content: string;
    images: { image_url: string }[];
    user: { nickname: string | null };
}

export default function ResumeDetailClient({ resume }: { resume: Resume }) {
    const router = useRouter();

    const handleChat = () => {
        // Chat integration logic here (Open chat room with resume owner)
        // For now, redirect to messages
        router.push('/messages');
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-dark-bg relative">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-gray-50 dark:border-dark-border">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 dark:text-gray-400">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-black text-gray-900 dark:text-gray-100">이력서 상세</h1>
                <div className="w-10" />
            </header>

            {/* Content Body */}
            <div className="pb-32">
                {/* Profile Top */}
                <div className="px-6 pt-8 pb-6 border-b border-gray-50 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-dark-bg border border-gray-100 dark:border-dark-border flex items-center justify-center overflow-hidden shadow-sm">
                            {resume.images?.[0] ? (
                                <img src={resume.images[0].image_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-[22px] font-black text-gray-900 dark:text-gray-100 mb-1">
                                {resume.nickname || resume.user?.nickname || '회원'}
                            </h2>
                            <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400 font-bold">
                                <span className="flex items-center gap-1"><Calendar size={13} /> {resume.age ?? '??'}세</span>
                                <span className="text-gray-200 dark:text-gray-700">|</span>
                                <span className="flex items-center gap-1"><MapPin size={13} /> {resume.region || '전국'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-white dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl text-[12px] font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5 shadow-sm">
                            <Briefcase size={13} className="text-amber-500" />
                            {resume.occupation || '전체 직종'}
                        </span>
                    </div>
                </div>

                {/* Content Text */}
                <div className="px-6 py-8">
                    <h3 className="text-[14px] font-black text-gray-400 dark:text-gray-600 mb-4 uppercase tracking-widest">Self Introduction</h3>
                    <div className="text-[16px] text-gray-800 dark:text-gray-200 font-bold leading-relaxed whitespace-pre-wrap">
                        {resume.content}
                    </div>
                </div>

                {/* Photos List */}
                {resume.images && resume.images.length > 0 && (
                    <div className="px-6 py-4 space-y-4">
                        <h3 className="text-[14px] font-black text-gray-400 dark:text-gray-600 mb-2 uppercase tracking-widest">Photos</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {resume.images.map((img, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border shadow-sm">
                                    <img src={img.image_url} alt={`Resume Photo ${i}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white dark:from-dark-bg via-white/90 dark:via-dark-bg/90 to-transparent z-40">
                <button 
                    onClick={handleChat}
                    className="w-full max-w-md mx-auto h-16 bg-amber-500 text-white rounded-[24px] font-black text-[17px] flex items-center justify-center gap-3 shadow-xl shadow-amber-200 dark:shadow-none active:scale-95 transition-all"
                >
                    <MessageSquare size={20} fill="currentColor" />
                    1:1 채팅하기
                </button>
            </div>
        </div>
    );
}
