'use client'

import React, { useState, useEffect } from 'react'
import { Save, Globe, Phone, CreditCard, Layout, AlertCircle } from 'lucide-react'

export default function AdminSettingsPage() {
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/common/site-config')
            const data = await res.json()
            setConfig(data)
        } catch (error) {
            console.error('Fetch config error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        try {
            const res = await fetch('/api/common/site-config', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            if (res.ok) {
                setMessage('설정이 저장되었습니다.')
            } else {
                setMessage('저장 중 오류가 발생했습니다.')
            }
        } catch (error) {
            setMessage('서버 통신 오류가 발생했습니다.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-10 text-center font-bold text-gray-400 dark:text-gray-500">설정 불러오는 중...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">사이트 환경 설정</h1>
                    <p className="text-sm text-gray-400 dark:text-gray-500">사이트의 전역 정보 및 공지 팝업을 관리합니다.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg dark:shadow-none hover:bg-amber-600 transition disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? '저장 중...' : '설정 저장하기'}
                </button>
            </header>

            {message && (
                <div className={`p-4 rounded-xl font-bold flex items-center gap-2 ${message.includes('오류') ? 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'}`}>
                    <AlertCircle size={18} />
                    {message}
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border space-y-4">
                    <div className="flex items-center gap-2 text-amber-500 font-black mb-2">
                        <Globe size={18} />
                        <span>기본 정보</span>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">사이트명</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                            value={config.site_name || ''}
                            onChange={e => setConfig({ ...config, site_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">고객센터 번호</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                            value={config.contact_phone || ''}
                            onChange={e => setConfig({ ...config, contact_phone: e.target.value })}
                        />
                    </div>
                </div>

                {/* Bank Info */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border space-y-4">
                    <div className="flex items-center gap-2 text-orange-500 font-black mb-2">
                        <CreditCard size={18} />
                        <span>무통장 입금 정보</span>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">은행명</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                            value={config.bank_name || ''}
                            onChange={e => setConfig({ ...config, bank_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">계좌번호</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                            value={config.bank_account || ''}
                            onChange={e => setConfig({ ...config, bank_account: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">예금주</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                            value={config.bank_owner || ''}
                            onChange={e => setConfig({ ...config, bank_owner: e.target.value })}
                        />
                    </div>
                </div>

                {/* Alert/Popup */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border space-y-4 md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-purple-500 font-black">
                            <AlertCircle size={18} />
                            <span>상단 알림 팝업</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-none bg-gray-100 dark:bg-dark-bg text-amber-500 focus:ring-offset-0 focus:ring-amber-500"
                                checked={!!config.is_alert_active}
                                onChange={e => setConfig({ ...config, is_alert_active: e.target.checked })}
                            />
                            <span className="text-sm font-black text-gray-600 dark:text-gray-400">활성화</span>
                        </label>
                    </div>
                    <textarea
                        className="w-full p-4 bg-gray-50 dark:bg-dark-bg border-none rounded-2xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition min-h-[100px]"
                        placeholder="알림 내용을 입력하세요..."
                        value={config.alert_message || ''}
                        onChange={e => setConfig({ ...config, alert_message: e.target.value })}
                    ></textarea>
                </div>

                {/* Footer Info */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-black mb-2">
                        <Layout size={18} />
                        <span>푸터 정보 (사업자 정보)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">상호명</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                                value={config.footer_company_name || ''}
                                onChange={e => setConfig({ ...config, footer_company_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">대표자명</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                                value={config.footer_ceo_name || ''}
                                onChange={e => setConfig({ ...config, footer_ceo_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">사업자등록번호</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                                value={config.footer_business_num || ''}
                                onChange={e => setConfig({ ...config, footer_business_num: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">통신판매업신고번호</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                                value={config.footer_report_num || ''}
                                onChange={e => setConfig({ ...config, footer_report_num: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">팩스번호</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                                value={config.footer_fax || ''}
                                onChange={e => setConfig({ ...config, footer_fax: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">직업정보제공사업신고번호</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                                value={config.footer_job_info_num || ''}
                                onChange={e => setConfig({ ...config, footer_job_info_num: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">주소</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border-none rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition"
                                value={config.footer_address || ''}
                                onChange={e => setConfig({ ...config, footer_address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Chat Automation Info */}
                <div className="bg-white dark:bg-dark-card p-6 rounded-[35px] shadow-sm border border-gray-100 dark:border-dark-border space-y-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-blue-500 font-black">
                            <Phone size={18} />
                            <span className="text-lg">1:1 채팅 자동 안내 설정</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-2xl transition hover:opacity-80">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-none bg-gray-100 dark:bg-dark-bg text-blue-500 focus:ring-offset-0 focus:ring-blue-500"
                                checked={!!config.chat_automation_enabled}
                                onChange={e => setConfig({ ...config, chat_automation_enabled: e.target.checked })}
                            />
                            <span className="text-sm font-black text-blue-600 dark:text-blue-400">시스템 활성화</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Welcome Messages */}
                        <div className="space-y-4">
                            <div className="bg-blue-50/50 dark:bg-blue-950/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <h3 className="font-black text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    회원가입 환영 메시지
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">개인회원 (구직자)</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 transition min-h-[120px]"
                                            value={config.chat_welcome_personal_text || ''}
                                            onChange={e => setConfig({ ...config, chat_welcome_personal_text: e.target.value })}
                                        />
                                        <p className="mt-1 text-[10px] text-gray-400 font-bold">사용 가능: {"{resume_url}, {community_url}"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">업소회원 (기업주)</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 transition min-h-[100px]"
                                            value={config.chat_welcome_employer_text || ''}
                                            onChange={e => setConfig({ ...config, chat_welcome_employer_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="pt-2 border-t border-blue-50 dark:border-blue-900/30">
                                        <label className="block text-xs font-black text-blue-500/70 dark:text-blue-400/50 mb-1">고객센터(QnA) 첫 채팅 안내</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-amber-500 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 transition min-h-[100px] border-2 border-amber-50 dark:border-pink-900/20"
                                            value={config.chat_qna_welcome_text || ''}
                                            onChange={e => setConfig({ ...config, chat_qna_welcome_text: e.target.value })}
                                        />
                                        <p className="mt-1 text-[10px] text-gray-400 font-bold">사용 가능: {"{site_url}"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50/50 dark:bg-orange-950/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                <h3 className="font-black text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                    결제 단계별 안내
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">무통장 입금 안내 (신청 즉시)</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-500 transition min-h-[120px]"
                                            value={config.chat_payment_bank_text || ''}
                                            onChange={e => setConfig({ ...config, chat_payment_bank_text: e.target.value })}
                                        />
                                        <p className="mt-1 text-[10px] text-gray-400 font-bold">사용 가능: {"{금액}, {은행}, {계좌}, {예금주}, {상품명}"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">카드 결제 완료 안내</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-500 transition min-h-[100px]"
                                            value={config.chat_payment_card_text || ''}
                                            onChange={e => setConfig({ ...config, chat_payment_card_text: e.target.value })}
                                        />
                                        <p className="mt-1 text-[10px] text-gray-400 font-bold">사용 가능: {"{금액}, {상품명}, {job_no}"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expiry Reminders */}
                        <div className="space-y-4">
                            <div className="bg-amber-50/50 dark:bg-pink-950/10 p-4 rounded-2xl border border-amber-100 dark:border-pink-900/30">
                                <h3 className="font-black text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    공고 마감 리마인드 (기업주)
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">마감 3일 전 안내</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition min-h-[100px]"
                                            value={config.chat_expiry_3d_text || ''}
                                            onChange={e => setConfig({ ...config, chat_expiry_3d_text: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">마감 1일 전 안내</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition min-h-[100px]"
                                            value={config.chat_expiry_1d_text || ''}
                                            onChange={e => setConfig({ ...config, chat_expiry_1d_text: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 dark:text-gray-600 mb-1">마감 1일 후 (중단 안내)</label>
                                        <textarea
                                            className="w-full p-3 bg-white dark:bg-dark-bg border-none rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 transition min-h-[100px]"
                                            value={config.chat_expired_1d_text || ''}
                                            onChange={e => setConfig({ ...config, chat_expired_1d_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="p-3 bg-white/50 dark:bg-dark-bg/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                        <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                                            💡 공통 치환자: {"{job_title}, {payment_url}"} <br/>
                                            * {"{payment_url}"}은 해당 공고의 결제 페이지로 100% 자동 연결됩니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
