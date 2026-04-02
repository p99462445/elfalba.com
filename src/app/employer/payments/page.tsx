'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Clock, CreditCard, Zap } from 'lucide-react'

export default function PurchaseHistoryPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [payments, setPayments] = useState<any[]>([])

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await fetch('/api/employer/payments')
                if (res.ok) setPayments(await res.json())
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchPayments()
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#fcfcfc] dark:bg-dark-bg text-gray-800 dark:text-gray-100 font-sans pb-28">
            {/* Nav */}
            <nav className="sticky top-0 z-[2000] bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border px-6 h-16 flex items-center gap-4 text-amber-500">
                <Link href="/employer" className="p-2 hover:bg-amber-50 dark:hover:bg-pink-950/20 rounded-full transition text-gray-400 hover:text-amber-500">
                    <ArrowLeft size={22} />
                </Link>
                <div className="flex-1 flex items-center gap-2">
                    <CreditCard size={22} className="text-amber-500" />
                    <h1 className="text-lg font-black tracking-tighter uppercase text-gray-900 dark:text-gray-100">결제 내역 관리</h1>
                </div>
            </nav>

            <main className="max-w-xl mx-auto px-4 pt-8">
                <section>
                    <div className="flex items-center justify-between mb-8 pl-1">
                        <h3 className="text-[14px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
                            광고 결제 현황 <span className="text-amber-500">{payments.length}</span>
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="bg-[#111111] dark:bg-dark-card border border-gray-800 dark:border-dark-border rounded-[30px] p-6 hover:border-amber-500 transition shadow-2xl relative overflow-hidden group"
                            >
                                <div className="flex flex-col">
                                    {/* Top Line: Product, Job No, Status */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[12px] font-black text-amber-500 uppercase tracking-tight">
                                                {payment.product?.name || '광고 상품'}
                                            </span>
                                            {payment.job && (
                                                <span className="text-[13px] font-black text-white">
                                                    공고번호 {payment.job.job_no}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-[11px] font-black shadow-sm transition-all ${payment.status === 'APPROVED'
                                            ? 'bg-green-600 text-white'
                                            : payment.payment_method === 'CARD'
                                                ? 'bg-purple-600 text-white animate-pulse'
                                                : 'bg-yellow-500 text-white animate-pulse'
                                            }`}>
                                            {payment.status === 'APPROVED' 
                                                ? '승인됨' 
                                                : payment.payment_method === 'CARD' 
                                                    ? '검수 중' 
                                                    : '입금대기'}
                                        </span>
                                    </div>

                                    {/* Integrated Job Card Section */}
                                    {payment.job && (
                                        <div
                                            onClick={() => router.push(`/employer/jobs/${payment.job.id}/edit`)}
                                            className="bg-[#1a1a1a] dark:bg-dark-bg/50 rounded-2xl p-3 flex gap-3 items-center border border-gray-800 mb-4 cursor-pointer hover:bg-gray-800 transition"
                                        >
                                            <div className="w-[52px] h-[52px] rounded-xl bg-gray-800 flex-shrink-0 flex items-center justify-center border border-gray-700 shadow-sm overflow-hidden relative">
                                                {payment.job.logo_url ? (
                                                    <img src={payment.job.logo_url} className="object-contain w-full h-full" alt="" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-[10px] font-bold">
                                                        NO LOGO
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1.5">
                                                <div className="flex items-center gap-1 leading-none">
                                                    <span className="text-[13px] font-black text-white tracking-tight truncate">{payment.job.title}</span>
                                                    <span className="text-[9px] text-gray-500 font-bold ml-2">
                                                        {Math.max(1, Math.ceil((new Date().getTime() - new Date(payment.job.created_at).getTime()) / (1000 * 60 * 60 * 24)))}일째
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-[11px] text-gray-400 truncate leading-none">{payment.job.business_name || '상호명 미등록'}</h3>
                                                <div className="flex items-center gap-3 leading-none">
                                                    <div className="text-[12px] font-black flex items-center gap-1">
                                                        <span className="text-amber-500">TC</span>
                                                        <span className="text-gray-300 tracking-tighter">{payment.job.salary_info || '협의'}</span>
                                                    </div>
                                                    <div className="text-[9px] text-gray-500 font-bold flex gap-1">
                                                        <span>{payment.job.region?.name || '지역미상'}</span>
                                                        <span>·</span>
                                                        <span>{payment.job.category?.name || '기타'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 하단 금액 및 연장하기 버튼 */}
                                    <div className="flex flex-col gap-4 border-t border-gray-800 pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[20px] font-black text-white">
                                                    {payment.amount.toLocaleString()}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-500 uppercase">KRW</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[12px] text-white font-black">
                                                <Clock size={12} strokeWidth={3} className="text-amber-500" />
                                                <span>{new Date(payment.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (payment.job?.id) router.push(`/employer/jobs/${payment.job.id}/payment`);
                                            }}
                                            className="w-full bg-[#111111] dark:bg-black border-2 border-[#FF007A] text-[#FF007A] py-3.5 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2 hover:bg-gray-900 transition shadow-lg active:scale-[0.98]"
                                        >
                                            <Zap size={14} fill="currentColor" />
                                            <span>공고 연장 하기</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {payments.length === 0 && (
                            <div className="py-24 text-center bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[40px] shadow-sm">
                                <CreditCard size={48} className="text-gray-100 dark:text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">결제 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}
