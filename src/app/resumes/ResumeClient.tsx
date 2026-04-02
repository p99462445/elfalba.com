'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Megaphone, Lock, UserPlus, CreditCard, PlusCircle, LayoutGrid, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Resume {
    id: string;
    nickname: string;
    age: number | null;
    region: string | null;
    occupation: string | null;
    content: string;
    thumbnail: string | null;
    created_at: string;
}

interface Notice {
    content: string;
}

export default function ResumeClient() {
    const { user, userRole } = useAuth();
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPaywall, setShowPaywall] = useState<{ type: 'GUEST' | 'UNPAID', jobCount?: number } | null>(null);
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const [showPersonalOnly, setShowPersonalOnly] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // Check for error query params
            const params = new URLSearchParams(window.location.search);
            if (params.get('error') === 'personal-only') {
                setShowPersonalOnly(true);
                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
            }

            try {
                const [rRes, nRes] = await Promise.all([
                    fetch('/api/resumes'),
                    fetch('/api/resumes/notice')
                ]);
                const [rData, nData] = await Promise.all([rRes.json(), nRes.json()]);
                setResumes(Array.isArray(rData) ? rData : []);
                setNotice(nData);
            } catch (err) {
                console.error('Failed to fetch resumes:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleResumeClick = async (resumeId: string) => {
        // 비회원 / 일반 회원 체크
        if (!user || userRole === 'USER') {
            setShowPaywall({ type: 'GUEST' });
            return;
        }

        // 기업 회원일 경우 광고 여부 체크 (Client-side API call or Auth info)
        if (userRole === 'EMPLOYER') {
            try {
                const res = await fetch('/api/user/ad-status');
                const data = await res.json();
                
                if (!data.isActive) {
                    setShowPaywall({ type: 'UNPAID', jobCount: data.jobCount });
                    return;
                }
                
                // 광고권 있으면 상세 페이지로 (아직 상세 페이지는 구현 전이므로 나중에)
                router.push(`/밤알바구인구직/${resumeId}`);
            } catch (e) {
                console.error('Ad check failed:', e);
            }
        }
    };

    const handleWriteClick = () => {
        if (!user) {
            router.push('/login?returnUrl=/밤알바구인구직/등록');
            return;
        }
        if (userRole === 'EMPLOYER') {
            setShowPersonalOnly(true);
            return;
        }
        router.push('/밤알바구인구직/등록');
    };

    if (isLoading) return <div className="p-10 text-center font-bold text-gray-400">정보를 불러오는 중...</div>;

    return (
        <div className="max-w-md mx-auto min-h-screen pb-20">
            {/* Notice Section */}
            {notice && (
                <div className="mx-4 mt-4 mb-2">
                    <div className="bg-gray-100 dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden transition-all">
                        <button
                            onClick={() => setIsRulesOpen(true)}
                            className="w-full flex items-center justify-between p-4 bg-transparent active:scale-95 transition-transform"
                        >
                            <div className="flex items-center gap-2">
                                <Megaphone size={16} className="text-gray-500 dark:text-gray-400 fill-gray-500 dark:fill-gray-400" />
                                <h2 className="text-[14px] font-black text-gray-700 dark:text-gray-300 line-clamp-1">인재정보 이용 규칙 안내</h2>
                            </div>
                            <ChevronRight size={18} className="text-gray-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* Title Bar */}
            <div className="px-5 mt-6 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    <h2 className="text-[19px] font-black text-gray-900 dark:text-gray-100">최신 인재정보</h2>
                </div>
                <button 
                    onClick={handleWriteClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full transition-all active:scale-95 shadow-lg shadow-amber-100 dark:shadow-none"
                >
                    <PlusCircle size={14} />
                    <span className="text-[12px] font-black">이력서 작성</span>
                </button>
            </div>

            {/* Resume List */}
            <div className="px-4 space-y-3">
                {resumes.map((resume) => (
                    <div 
                        key={resume.id}
                        onClick={() => handleResumeClick(resume.id)}
                        className="p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[24px] flex gap-4 transition-all active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden group"
                    >
                        {/* Dot or Thumbnail */}
                        <div className="flex-shrink-0 w-[60px] h-[60px] rounded-2xl bg-gray-50 dark:bg-dark-bg flex items-center justify-center overflow-hidden border border-gray-50 dark:border-dark-border">
                            {resume.thumbnail ? (
                                <img src={resume.thumbnail} alt={resume.nickname} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-pink-950/30 px-2 py-0.5 rounded-lg shrink-0">
                                    {resume.age ?? '??'}세
                                </span>
                                <span className="text-[14px] font-black text-gray-900 dark:text-gray-100 truncate">
                                    {resume.region || '전국'} · {resume.occupation || '전체'}
                                </span>
                            </div>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-bold truncate">
                                {resume.content}
                            </p>
                        </div>
                    </div>
                ))}

                {resumes.length === 0 && (
                    <div className="py-20 text-center text-gray-400 font-bold">등록된 이력서가 없습니다.</div>
                )}
            </div>

            {/* Paywall Modals */}
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPaywall(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-dark-card rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-pink-950/30 rounded-[24px] flex items-center justify-center text-amber-500 mb-6">
                                <Lock size={28} />
                            </div>
                            <h3 className="text-[20px] font-black text-gray-900 dark:text-gray-100 mb-2">열람 권한 안내</h3>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed mb-8">
                                {showPaywall.type === 'GUEST' 
                                    ? '인재정보 상세 열람은\n기업 회원만 가능합니다.' 
                                    : '인재정보 상세 열람은\n광고 결제 중인 업주님만 가능합니다.'}
                            </p>

                            <div className="space-y-2.5">
                                {showPaywall.type === 'GUEST' ? (
                                    <button 
                                        onClick={() => router.push('/signup?role=EMPLOYER')}
                                        className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-amber-100 dark:shadow-none"
                                    >
                                        <UserPlus size={18} />
                                        기업 회원가입 하기
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => router.push(showPaywall.jobCount && showPaywall.jobCount > 0 ? '/employer' : '/employer/business')}
                                        className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-amber-100 dark:shadow-none"
                                    >
                                        <CreditCard size={18} />
                                        광고 결제하러 가기
                                    </button>
                                )}
                                <button 
                                    onClick={() => setShowPaywall(null)}
                                    className="w-full h-14 bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400 rounded-2xl font-black text-[14px]"
                                >
                                    다음에 하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rules Modal */}
            {isRulesOpen && notice && (
                <div className="fixed inset-0 z-[5000] bg-white dark:bg-dark-bg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <header className="h-14 border-b border-gray-50 dark:border-dark-border flex items-center px-4 sticky top-0 bg-white dark:bg-dark-card">
                        <button onClick={() => setIsRulesOpen(false)} className="text-gray-900 dark:text-gray-100 p-2 -ml-2 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-[15px] font-black text-gray-900 dark:text-gray-100 ml-2">인재정보 이용 규칙</h2>
                    </header>
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-6 py-8 text-[14px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed space-y-8 break-keep">
                            <div className="whitespace-pre-wrap font-bold leading-relaxed">
                                {notice.content}
                            </div>
                            
                            <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-8 border-t border-gray-100 dark:border-dark-border pt-6 text-center font-bold">
                                📌 본 인재정보 이용 규칙은 엘프알바 운영 정책에 따릅니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Personal Only Warning Modal */}
            {showPersonalOnly && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPersonalOnly(false)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-dark-card rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-pink-950/30 rounded-[24px] flex items-center justify-center text-amber-500 mb-6">
                                <UserPlus size={28} />
                            </div>
                            <h3 className="text-[20px] font-black text-gray-900 dark:text-gray-100 mb-2">개인회원 전용</h3>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed mb-8">
                                이력서 작성은<br />개인회원 전용 기능입니다.
                            </p>

                            <button 
                                onClick={() => setShowPersonalOnly(false)}
                                className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-amber-100 dark:shadow-none"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
