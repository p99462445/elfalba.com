'use client'
import React, { useState, useMemo } from 'react'
import { Search, X, CheckCircle, Image as ImageIcon } from 'lucide-react'

export default function PaymentsTable({ initialPayments }: { initialPayments: any[] }) {
    const [payments, setPayments] = useState(initialPayments)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchFilter, setSearchFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL')

    // 상세보기 모달 상태
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null)

    // 페이지네이션 및 열 너비 상태
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)
    const [colWidths, setColWidths] = useState<number[]>([120, 100, 120, 120, 100, 140, 120, 100, 100])

    const handleMouseDown = (index: number, e: React.MouseEvent) => {
        e.preventDefault()
        const startX = e.clientX
        const startWidth = colWidths[index]

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX))
            setColWidths(prev => {
                const next = [...prev]
                next[index] = newWidth
                return next
            })
        }

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    const handleApprove = async (id: string) => {
        if (!confirm('입금 내역을 확인하셨습니까? 승인 시 공고 노출이 즉시 시작됩니다.')) return

        setLoadingId(id)
        try {
            const res = await fetch('/api/admin/action', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'PAYMENT_APPROVAL' })
            })
            if (res.ok) {
                alert('결제가 승인되고 공고가 활성화되었습니다.')
                setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p))
                if (selectedPayment?.id === id) {
                    setSelectedPayment((prev: any) => ({ ...prev, status: 'APPROVED' }))
                }
            } else {
                const data = await res.json()
                alert(data.error || '승인 실패')
            }
        } catch (e) {
            console.error(e)
            alert('오류 발생')
        } finally {
            setLoadingId(null)
            setSelectedPayment(null)
        }
    }

    // 전역 검색 및 필터링 로직
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            // 탭 필터
            if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

            // 검색어 필터 (검색조건 선택 가능)
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                
                if (searchFilter === 'DEPOSITOR') return p.depositor_name?.toLowerCase().includes(q)
                if (searchFilter === 'PHONE') return p.user?.phone?.includes(q) || p.job?.employer?.phone?.includes(q)
                if (searchFilter === 'BIZ_NAME') return p.job?.employer?.business_name?.toLowerCase().includes(q)
                if (searchFilter === 'JOB_NO') return p.job?.job_no?.toString().includes(q) || `#${p.job?.job_no}`.includes(q)
                if (searchFilter === 'USER_ID') return p.user?.email?.toLowerCase().includes(q)

                // ALL
                const searchString = `
                    ${p.depositor_name || ''} 
                    ${p.user?.name || ''}
                    ${p.user?.real_name || ''}
                    ${p.user?.email || ''} 
                    ${p.user?.phone || ''} 
                    ${p.job?.employer?.business_name || ''} 
                    ${p.job?.employer?.phone || ''}
                    ${p.job?.job_no || ''}
                `.toLowerCase()

                if (!searchString.includes(q)) return false;
            }
            return true;
        }).sort((a, b) => {
            // 입금대기를 무조건 상위로
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
    }, [payments, searchQuery, statusFilter])

    // 검색이나 필터가 바뀌면 1페이지로
    React.useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, searchFilter])

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
    const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const pageGroupSize = 10;
    const currentGroup = Math.ceil(currentPage / pageGroupSize);
    const startPage = Math.max(1, (currentGroup - 1) * pageGroupSize + 1);
    const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
    const pagesInGroup = Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i);

    const getEmployerPaymentsCount = (employerId: string) => {
        return payments.filter(p => p.job?.employer?.id === employerId && p.status === 'APPROVED').length;
    }

    return (
        <div className="flex flex-col">
            {!selectedPayment ? (
                <>
                    {/* 상단 컨트롤 영역: 검색 + 탭 */}
                    <div className="p-6 border-b border-gray-100 dark:border-dark-border flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-dark-card">
                        <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-xl">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-4 py-2 text-[13px] font-black rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-white dark:bg-dark-card shadow dark:shadow-none text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                전체 리스트
                            </button>
                            <button
                                onClick={() => setStatusFilter('PENDING')}
                                className={`px-4 py-2 text-[13px] font-black rounded-lg transition-all flex items-center gap-1 ${statusFilter === 'PENDING' ? 'bg-white dark:bg-dark-card shadow dark:shadow-none text-amber-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                입금 대기
                                <span className="bg-amber-100 dark:bg-pink-950/30 text-amber-500 dark:text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full">{payments.filter(p => p.status === 'PENDING').length}</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('APPROVED')}
                                className={`px-4 py-2 text-[13px] font-black rounded-lg transition-all ${statusFilter === 'APPROVED' ? 'bg-white dark:bg-dark-card shadow dark:shadow-none text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                결제 완료
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-bold">보기:</span>
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    className="bg-white border hover:border-amber-300 rounded text-xs px-1 py-0.5 outline-none font-bold"
                                >
                                    {[10, 20, 30, 40, 50, 100].map(n => (
                                        <option key={n} value={n}>{n}건씩</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative w-full md:w-96 flex items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus-within:border-amber-300 transition-all shadow-sm overflow-hidden">
                                <select
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border py-3 px-3 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
                                >
                                    <option value="ALL">전체</option>
                                    <option value="DEPOSITOR">입금자명</option>
                                    <option value="PHONE">연락처</option>
                                    <option value="BIZ_NAME">업소(상호)명</option>
                                    <option value="JOB_NO">공고번호</option>
                                    <option value="USER_ID">가입ID(이메일)</option>
                                </select>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" size={16} />
                                    <input
                                        type="text"
                                        placeholder="검색어 입력..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 bg-transparent text-sm font-bold focus:outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 테이블 데이터 영역 */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                            <thead>
                                <tr className="border-b dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300">
                                    {['결제시간', '이름', '전화번호', '입금자명', '공고번호', '결제상품', '금액', '상태', '관리'].map((header, index) => (
                                        <th key={header} style={{ width: colWidths[index] }} className="p-4 font-bold text-[12px] relative truncate">
                                            <div className="flex items-center justify-between">
                                                <span>{header}</span>
                                            </div>
                                            {/* 열 길이 조절 핸들 */}
                                            <div
                                                onMouseDown={(e) => handleMouseDown(index, e)}
                                                className="absolute right-0 top-0 w-2.5 h-full cursor-col-resize hover:bg-amber-300 z-10 select-none group"
                                            >
                                                <div className="w-[1px] h-full bg-gray-200 dark:bg-dark-border mx-auto group-hover:bg-amber-400"></div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPayments.map(payment => (
                                    <tr key={payment.id} className="border-b dark:border-dark-border hover:bg-amber-50/10 dark:hover:bg-pink-900/10 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-[12px] text-gray-600 dark:text-gray-400">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="font-medium text-[10px] text-gray-400 dark:text-gray-500">
                                                {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[13px] font-black text-gray-800 dark:text-gray-100">
                                                {payment.user?.name || payment.user?.real_name || '이름미상'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">{payment.user?.phone || '번호없음'}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-[13px] font-black ${payment.status === 'PENDING' ? 'bg-amber-100 dark:bg-pink-950/30 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-pink-900/50 shadow-sm' : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400'}`}>
                                                {payment.depositor_name || '미입력'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {payment.job ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-[13px] text-gray-800 dark:text-gray-200 border-b-2 border-gray-200 dark:border-dark-border px-1 pb-0.5">
                                                        #{payment.job.job_no}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 mt-1">남은 점프: {payment.job.remaining_auto_jumps}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">{payment.product?.name || '상품 정보 없음'}</span>
                                        </td>
                                        <td className="p-4 font-black text-[14px] text-gray-900 dark:text-gray-100">
                                            {payment.amount.toLocaleString()}원
                                        </td>
                                        <td className="p-4 text-center">
                                            {payment.status === 'APPROVED' ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-green-500">결제완료</span>
                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{new Date(payment.updated_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                </div>
                                            ) : (
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${payment.payment_method === 'CARD' ? 'bg-purple-500' : 'bg-amber-500'} text-white animate-pulse shadow-sm`}>
                                                    {payment.payment_method === 'CARD' ? '카드 승인 대기' : '입금대기'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedPayment(payment)}
                                                className="bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white rounded-xl text-[11px] font-black hover:bg-amber-500 transition-all active:scale-95 shadow dark:shadow-none"
                                            >
                                                상세보기
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-20 text-center">
                                            <p className="text-gray-400 dark:text-gray-500 font-bold mb-2">검색 결과가 없거나 결제 내역이 없습니다.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className="p-6 border-t border-gray-100 dark:border-dark-border flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-dark-card rounded-b-2xl">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                                title="첫 페이지"
                            >
                                &laquo;
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                이전
                            </button>
                            {pagesInGroup.map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-black transition-all flex items-center justify-center shrink-0 ${currentPage === page ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                다음
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50"
                                title="마지막 페이지"
                            >
                                &raquo;
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full bg-white dark:bg-dark-card animate-in fade-in duration-300">
                    {/* 왼쪽: iframe (수정 페이지) 컨테이너 */}
                    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border">
                        <div className="p-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-card z-10 shrink-0">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    결제 검수 및 공고 확인
                                    <span className="text-[12px] bg-gray-100 dark:bg-dark-bg px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 font-bold border border-gray-200 dark:border-dark-border">#{selectedPayment.job?.job_no || '번호없음'}</span>
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">입금자명: <span className="text-amber-600 dark:text-amber-400 font-black">{selectedPayment.depositor_name || '미입력'}</span></span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                    <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">결제상품: <span className="text-gray-900 dark:text-gray-100 font-black">{selectedPayment.product?.name || '정보없음'}</span></span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white rounded-xl text-sm font-black hover:bg-gray-800 transition-all shadow-md active:scale-95"
                            >
                                <X size={18} />
                                닫기 및 목록으로
                            </button>
                        </div>

                        {/* 아이프레임 (공고 수정 페이지 인베딩) */}
                        <div className="flex-1 w-full bg-gray-50 dark:bg-dark-bg overflow-hidden relative">
                            {selectedPayment.job?.id ? (
                                <iframe
                                    src={`/admin/jobs/${selectedPayment.job.id}/edit?hideHeader=true`}
                                    className="w-full h-full border-none"
                                    title="Job Edit Form"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <CheckCircle size={48} className="mb-4 text-gray-200" />
                                    <p className="font-bold">연결된 채용공고 정보가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 상세 내역 및 결정 버튼 (420px 고정) */}
                    <div className="w-full md:w-[420px] shrink-0 h-full flex flex-col bg-white dark:bg-dark-card shadow-[-10px_0_30px_rgba(0,0,0,0.03)] dark:shadow-none z-20">
                        {/* 오른쪽 헤더 */}
                        <div className="p-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-card shrink-0">
                            <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">결제 및 사업자 상세정보</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
                            {/* 결제 내역 핵심정보 */}
                            <section>
                                <div className="bg-amber-50 dark:bg-pink-900/10 rounded-2xl p-5 border border-amber-100 dark:border-pink-900/50">
                                    <h4 className="text-[11px] font-black text-amber-400 dark:text-amber-500 mb-3 tracking-widest">결제자 (입금자) 정보</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">신청된 입금자명</span>
                                            <span className="text-[16px] font-black text-amber-600 dark:text-amber-400 bg-white dark:bg-dark-card px-2 py-0.5 rounded shadow-sm dark:shadow-none">{selectedPayment.depositor_name || '미입력'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">결제 금액</span>
                                            <span className="text-[15px] font-black text-gray-900 dark:text-gray-100">{selectedPayment.amount.toLocaleString()}원</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-amber-100/50 dark:border-pink-900/20">
                                            <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">누적 결제 이력</span>
                                            <span className="text-[13px] font-black text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-card px-2 py-1 rounded">
                                                총 완료 <span className="text-amber-500 dark:text-amber-400">{selectedPayment.job?.employer?.id ? getEmployerPaymentsCount(selectedPayment.job.employer.id) : 0}</span>회
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 사업자 정보 */}
                            <section>
                                <h4 className="flex items-center gap-2 text-[14px] font-black text-gray-900 dark:text-gray-100 mb-4 px-1">
                                    <span className="w-1.5 h-4 bg-gray-900 dark:bg-gray-100 rounded-full"></span>
                                    영업장(사업자) 등록 정보
                                </h4>
                                <div className="bg-gray-50 dark:bg-dark-bg rounded-2xl p-5 space-y-4 border border-gray-100 dark:border-dark-border">
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-200/50 dark:border-dark-border pb-3">
                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-600">상호명</span>
                                        <span className="col-span-2 text-[13px] font-black text-gray-900 dark:text-gray-100">{selectedPayment.job?.employer?.business_name || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-200/50 dark:border-dark-border pb-3">
                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-600">대표자명</span>
                                        <span className="col-span-2 text-[13px] font-black text-gray-900 dark:text-gray-100">{selectedPayment.job?.employer?.owner_name || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-200/50 dark:border-dark-border pb-3">
                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-600">사업자번호</span>
                                        <span className="col-span-2 text-[13px] font-black text-gray-900 dark:text-gray-100">{selectedPayment.job?.employer?.business_number || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-gray-200/50 dark:border-dark-border pb-3">
                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-600">연락처</span>
                                        <span className="col-span-2 text-[13px] font-black text-gray-900 dark:text-gray-100">{selectedPayment.job?.employer?.phone || selectedPayment.user?.phone || '-'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 pt-1">
                                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-600">주소재지</span>
                                        <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300 leading-relaxed break-keep">{selectedPayment.job?.employer?.address || '-'}</span>
                                    </div>

                                    {/* 사업자 사본 이미지 박스 */}
                                    <div className="pt-4 mt-2 border-t border-gray-200 dark:border-dark-border">
                                        <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 mb-2">사업자 사본 서류</p>
                                        {selectedPayment.job?.employer?.business_license_url ? (
                                            <a
                                                href={selectedPayment.job.employer.business_license_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl hover:border-amber-300 transition group"
                                            >
                                                <ImageIcon size={28} className="text-gray-300 dark:text-gray-700 group-hover:text-amber-400 mb-2" />
                                                <span className="text-[12px] font-black text-gray-600 dark:text-gray-400 group-hover:text-amber-500">사본 다운로드/크게보기</span>
                                            </a>
                                        ) : (
                                            <div className="p-4 bg-gray-100 dark:bg-dark-bg rounded-xl text-center text-[11px] font-bold text-gray-400 dark:text-gray-600">
                                                업로드된 사본 파일이 없습니다.
                                            </div>
                                        )}
                                    </div>

                                    {/* 점프 연동 수정 섹션 - 추가 */}
                                    {selectedPayment.job && (
                                        <div className="pt-4 mt-2 border-t border-gray-200 dark:border-dark-border">
                                            <h4 className="text-[11px] font-black text-blue-500 dark:text-blue-400 mb-3 tracking-widest uppercase">점프 현황 및 수정 (공고연동)</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-600 block mb-1">남은 점프 (회)</label>
                                                    <input
                                                        id={`admin-pay-jump-${selectedPayment.job.id}`}
                                                        type="number"
                                                        defaultValue={selectedPayment.job.remaining_auto_jumps}
                                                        className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm font-black outline-none focus:border-blue-300 transition text-gray-900 dark:text-gray-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-600 block mb-1">간격 (분)</label>
                                                    <input
                                                        id={`admin-pay-interval-${selectedPayment.job.id}`}
                                                        type="number"
                                                        defaultValue={selectedPayment.job.auto_jump_interval_min}
                                                        className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm font-black outline-none focus:border-blue-300 transition text-gray-900 dark:text-gray-100"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const jumpCount = parseInt((document.getElementById(`admin-pay-jump-${selectedPayment.job.id}`) as HTMLInputElement).value)
                                                    const intervalMin = parseInt((document.getElementById(`admin-pay-interval-${selectedPayment.job.id}`) as HTMLInputElement).value)

                                                    try {
                                                        const res = await fetch('/api/admin/action', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                id: selectedPayment.job.id,
                                                                type: 'JOB_JUMP_EDIT',
                                                                jumpCount,
                                                                intervalMin
                                                            })
                                                        })
                                                        if (res.ok) alert('점프 설정이 저장되었습니다. 대시보드와 즉시 연동됩니다.')
                                                    } catch (e) {
                                                        alert('저장 실패')
                                                    }
                                                }}
                                                className="w-full mt-3 py-3 bg-blue-600 text-white rounded-xl text-[12px] font-black hover:bg-blue-700 transition shadow-lg dark:shadow-none shadow-blue-100"
                                            >
                                                💾 점프 정보 저장하기
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </section>
                        </div>

                        <div className="p-5 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-none shrink-0 z-10">
                            {selectedPayment.status === 'PENDING' ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setSelectedPayment(null)} className="h-14 px-6 bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors rounded-2xl text-gray-600 dark:text-gray-400 font-black text-[15px]">
                                        닫기
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedPayment.id)}
                                        disabled={loadingId === selectedPayment.id}
                                        className="flex-1 h-14 bg-amber-500 hover:bg-amber-600 transition-all active:scale-[0.99] rounded-2xl flex items-center justify-center gap-2 text-white font-black text-[15px] shadow-xl dark:shadow-none shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle size={20} />
                                        {loadingId === selectedPayment.id ? '승인 처리중...' : '입금 확인 및 결제 승인 완료'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setSelectedPayment(null)} className="w-full h-14 bg-gray-900 dark:bg-gray-100 dark:text-dark-bg hover:bg-black transition-colors rounded-2xl flex items-center justify-center gap-2 text-white font-black text-[15px]">
                                    닫기
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}        </div>
    );
}
