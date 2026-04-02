'use client'
import React, { useState, useEffect } from 'react'

export default function DailySalesPage() {
    // Current year/month logic for default
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0')
    const startOfMonth = `${currentYear}-${currentMonthStr}-01`
    const endOfMonth = today.toISOString().split('T')[0]

    const [mode, setMode] = useState<'MONTHLY' | 'DAILY'>('DAILY')
    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonthStr}`)

    const [startDate, setStartDate] = useState(startOfMonth)
    const [endDate, setEndDate] = useState(endOfMonth)

    // Output Toggle
    const [showNew, setShowNew] = useState(true)
    const [showRepeat, setShowRepeat] = useState(true)
    const [showTotal, setShowTotal] = useState(true)
    const [showDetails, setShowDetails] = useState(true)

    // Status Toggle
    const [statusAll, setStatusAll] = useState(false)
    const [statusFilters, setStatusFilters] = useState({
        PENDING: true,
        APPROVED: true,
        CANCELED: false,
        FAILED: false
    })

    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const fetchStats = async () => {
        setLoading(true)
        try {
            // Determine dates based on mode
            let sendStart = startDate
            let sendEnd = endDate

            if (mode === 'MONTHLY') {
                const year = selectedMonth.split('-')[0]
                const month = selectedMonth.split('-')[1]
                sendStart = `${year}-${month}-01`
                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
                sendEnd = `${year}-${month}-${lastDay}`
            }

            // active statuses
            const activeStatuses = Object.keys(statusFilters).filter(k => (statusFilters as any)[k])

            const res = await fetch('/api/admin/payments/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: sendStart,
                    endDate: sendEnd,
                    statuses: activeStatuses
                })
            })
            const result = await res.json()
            if (result.success) {
                setData(result.data || [])
            } else {
                alert(result.error)
            }
        } catch (e: any) {
            alert('조회 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // Load initial data
    useEffect(() => {
        fetchStats()
    }, []) // Run once on mount

    const handleSearch = () => {
        fetchStats()
    }

    const toggleAllStatus = (checked: boolean) => {
        setStatusAll(checked)
        setStatusFilters({
            PENDING: checked,
            APPROVED: checked,
            CANCELED: checked,
            FAILED: checked
        })
    }

    const toggleStatus = (key: string, checked: boolean) => {
        const newFilters = { ...statusFilters, [key]: checked }
        setStatusFilters(newFilters)
        const allChecked = Object.values(newFilters).every(v => v === true)
        setStatusAll(allChecked)
    }

    // Totals
    const tNewCount = data.reduce((acc, curr) => acc + curr.newCount, 0)
    const tNewAmt = data.reduce((acc, curr) => acc + curr.newAmount, 0)
    const tRepCount = data.reduce((acc, curr) => acc + curr.repeatCount, 0)
    const tRepAmt = data.reduce((acc, curr) => acc + curr.repeatAmount, 0)
    const tTotCount = data.reduce((acc, curr) => acc + curr.totalCount, 0)
    const tTotAmt = data.reduce((acc, curr) => acc + curr.totalAmount, 0)
    const tBankAmt = data.reduce((acc, curr) => acc + curr.bankAmount, 0)
    const tPgAmt = data.reduce((acc, curr) => acc + curr.pgAmount, 0)

    const formatCurrency = (val: number) => val.toLocaleString()

    return (
        <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-purple-600">날짜별 매출통계</h1>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-bold text-gray-500 cursor-help" title="결제일 기준 실적 조회">?</span>
            </div>

            {/* Controls Filter Box */}
            <div className="flex border border-gray-300 dark:border-dark-border rounded select-none mb-8">
                <div className="flex-1 flex flex-col">

                    {/* Row 1: 월별 / 일별 선택 */}
                    <div className="flex border-b border-gray-200 dark:border-dark-border text-[13px]">
                        <div className="w-40 bg-gray-50 dark:bg-dark-bg p-3 flex items-center font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-dark-border">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={mode === 'MONTHLY'} onChange={() => setMode('MONTHLY')} className="accent-blue-600 w-4 h-4" />
                                <span>월별 통계</span>
                            </label>
                        </div>
                        <div className="p-3 flex items-center gap-2">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                disabled={mode !== 'MONTHLY'}
                                className="border border-gray-300 dark:border-dark-border rounded px-3 py-1 bg-white dark:bg-dark-card disabled:bg-gray-100 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="flex border-b border-gray-200 dark:border-dark-border text-[13px]">
                        <div className="w-40 bg-gray-50 dark:bg-dark-bg p-3 flex items-center font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-dark-border">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={mode === 'DAILY'} onChange={() => setMode('DAILY')} className="accent-blue-600 w-4 h-4" />
                                <span>일별 통계</span>
                            </label>
                        </div>
                        <div className="p-3 flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                disabled={mode !== 'DAILY'}
                                className="border border-gray-300 dark:border-dark-border rounded px-3 py-1 bg-white dark:bg-dark-card disabled:bg-gray-100 disabled:opacity-50"
                            />
                            <span className="text-gray-400">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                disabled={mode !== 'DAILY'}
                                className="border border-gray-300 dark:border-dark-border rounded px-3 py-1 bg-white dark:bg-dark-card disabled:bg-gray-100 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Row 2: 출력 항목 */}
                    <div className="flex border-b border-gray-200 dark:border-dark-border text-[13px]">
                        <div className="w-40 bg-gray-50 dark:bg-dark-bg p-3 flex items-center font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-dark-border">
                            출력 항목
                        </div>
                        <div className="p-3 flex items-center gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={showNew} onChange={e => setShowNew(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                                <span>신규 결제</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={showRepeat} onChange={e => setShowRepeat(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                                <span>재결제</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={showTotal} onChange={e => setShowTotal(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                                <span>매출합계</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={showDetails} onChange={e => setShowDetails(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                                <span>결제 내역</span>
                            </label>
                        </div>
                    </div>

                    {/* Row 3: 결제상태 */}
                    <div className="flex text-[13px]">
                        <div className="w-40 bg-gray-50 dark:bg-dark-bg p-3 flex items-center font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-dark-border">
                            결제상태
                        </div>
                        <div className="p-3 flex items-center gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={statusAll} onChange={e => toggleAllStatus(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                                <span>모두선택</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={statusFilters.PENDING} onChange={e => toggleStatus('PENDING', e.target.checked)} className="accent-blue-600 w-4 h-4" />
                                <span>입금대기</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={statusFilters.APPROVED} onChange={e => toggleStatus('APPROVED', e.target.checked)} className="accent-blue-600 w-4 h-4" />
                                <span>결제완료(승인)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={statusFilters.CANCELED} onChange={e => toggleStatus('CANCELED', e.target.checked)} className="accent-blue-600 w-4 h-4 border-amber-500" />
                                <span className="text-amber-600">고객취소</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={statusFilters.FAILED} onChange={e => toggleStatus('FAILED', e.target.checked)} className="accent-blue-600 w-4 h-4 border-amber-500" />
                                <span className="text-amber-600">거래실패(에러)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Side Search Button */}
                <button
                    onClick={handleSearch}
                    className="w-32 bg-[#2D4F88] hover:bg-[#203D6D] text-white flex flex-col items-center justify-center font-bold transition-colors shrink-0"
                >
                    {loading ? '검색 중...' : '검색'}
                </button>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto border border-gray-300 dark:border-dark-border rounded">
                <table className="w-full text-center text-[13px] border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-[#D9E1ED] text-[#2D4F88] font-black border-b border-gray-300 dark:border-dark-border leading-none h-11">
                            <th className="border-r border-gray-300 dark:border-dark-border font-bold w-36" rowSpan={2}>
                                년/월/일 [요일]
                            </th>
                            {showNew && <th className="border-r border-gray-300 dark:border-dark-border font-bold min-w-[120px]" colSpan={2}>신규 결제</th>}
                            {showRepeat && <th className="border-r border-gray-300 dark:border-dark-border font-bold min-w-[120px]" colSpan={2}>재 결제</th>}
                            {showTotal && <th className="border-r border-gray-300 dark:border-dark-border font-bold min-w-[120px]" colSpan={2}>매출 합계</th>}
                            {showDetails && <th className="font-bold min-w-[120px]" colSpan={2}>결제 내역</th>}
                        </tr>
                        <tr className="bg-[#D9E1ED] text-gray-700 font-bold border-b border-gray-300 dark:border-dark-border text-xs h-9">
                            {showNew && <><th className="border-r border-t border-gray-300 dark:border-dark-border w-16">결제수</th><th className="border-r border-t border-gray-300 dark:border-dark-border whitespace-nowrap px-4">결제</th></>}
                            {showRepeat && <><th className="border-r border-t border-gray-300 dark:border-dark-border w-16">결제수</th><th className="border-r border-t border-gray-300 dark:border-dark-border whitespace-nowrap px-4">결제</th></>}
                            {showTotal && <><th className="border-r border-t border-gray-300 dark:border-dark-border w-16">결제수</th><th className="border-r border-t border-gray-300 dark:border-dark-border whitespace-nowrap px-4">결제</th></>}
                            {showDetails && <><th className="border-r border-t border-gray-300 dark:border-dark-border px-4 whitespace-nowrap">은행</th><th className="border-t border-gray-300 dark:border-dark-border px-4 whitespace-nowrap">PG사</th></>}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300">
                        {data.map((row) => (
                            <tr key={row.date} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg h-9 text-xs">
                                <td className="border-r border-gray-200 dark:border-dark-border text-blue-500 font-semibold">{row.date} [{row.dayStr}]</td>

                                {showNew && (
                                    <>
                                        <td className="border-r border-gray-200 dark:border-dark-border">{row.newCount}</td>
                                        <td className="border-r border-gray-200 dark:border-dark-border text-gray-900 dark:text-gray-100">{formatCurrency(row.newAmount)}</td>
                                    </>
                                )}

                                {showRepeat && (
                                    <>
                                        <td className="border-r border-gray-200 dark:border-dark-border">{row.repeatCount}</td>
                                        <td className="border-r border-gray-200 dark:border-dark-border text-gray-900 dark:text-gray-100">{formatCurrency(row.repeatAmount)}</td>
                                    </>
                                )}

                                {showTotal && (
                                    <>
                                        <td className="border-r border-gray-200 dark:border-dark-border font-bold text-gray-900 dark:text-gray-100">{row.totalCount}</td>
                                        <td className="border-r border-gray-200 dark:border-dark-border font-bold text-gray-900 dark:text-gray-100">{formatCurrency(row.totalAmount)}</td>
                                    </>
                                )}

                                {showDetails && (
                                    <>
                                        <td className="border-r border-gray-200 dark:border-dark-border">{formatCurrency(row.bankAmount)}</td>
                                        <td className="text-gray-400">{formatCurrency(row.pgAmount)}</td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {data.length === 0 && !loading && (
                            <tr>
                                <td colSpan={10} className="py-20 text-center text-gray-400">데이터가 없습니다.</td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={10} className="py-20 text-center text-gray-500 font-bold animate-pulse">데이터를 불러오는 중입니다...</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-dark-bg border-t border-gray-300 dark:border-dark-border font-bold h-10 text-gray-900 dark:text-gray-100">
                        <tr>
                            <td className="border-r border-gray-300 dark:border-dark-border">합 계</td>

                            {showNew && (
                                <>
                                    <td className="border-r border-gray-300 dark:border-dark-border text-xs">{tNewCount}</td>
                                    <td className="border-r border-gray-300 dark:border-dark-border text-xs">{formatCurrency(tNewAmt)}</td>
                                </>
                            )}

                            {showRepeat && (
                                <>
                                    <td className="border-r border-gray-300 dark:border-dark-border text-xs">{tRepCount}</td>
                                    <td className="border-r border-gray-300 dark:border-dark-border text-xs">{formatCurrency(tRepAmt)}</td>
                                </>
                            )}

                            {showTotal && (
                                <>
                                    <td className="border-r border-gray-300 dark:border-dark-border text-xs">{tTotCount}</td>
                                    <td className="border-r border-gray-300 dark:border-dark-border text-xs text-blue-600 dark:text-blue-400">{formatCurrency(tTotAmt)}</td>
                                </>
                            )}

                            {showDetails && (
                                <>
                                    <td className="border-r border-gray-300 dark:border-dark-border text-xs">{formatCurrency(tBankAmt)}</td>
                                    <td className="text-xs">{formatCurrency(tPgAmt)}</td>
                                </>
                            )}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
} 
