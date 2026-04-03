'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Megaphone, MessageCircleQuestion, X, Plus, Lock, Send, ShieldCheck, ChevronLeft, HeadphonesIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useModal } from '@/providers/ModalProvider'
import { translateError } from '@/lib/utils/error-translator'

export const MOCK_NOTICES = [
  { id: '1', title: '엘프알바 그랜드 오픈 이벤트 안내', content: '엘프알바가 정식으로 오픈하였습니다. 많은 이용 부탁드립니다.', created_at: new Date().toISOString(), is_important: true },
  { id: '2', title: '허위 구인 공고 주의 안내', content: '최근 발생하는 허위 구인 공고에 각별히 유의하시기 바랍니다.', created_at: new Date().toISOString(), is_important: false },
  { id: '3', title: '모델/배우 프로필 등록 가이드', content: '더욱 매력적인 프로필을 등록하는 방법을 안내해 드립니다.', created_at: new Date().toISOString(), is_important: false }
];

interface Notice { id: string; title: string; content: string; is_important: boolean; created_at: string | Date }
interface QA { id: string; title: string; content: string; is_answer: boolean; created_at: string; user: { name: string | null; nickname: string | null; role: string } }
interface QAComment { id: string; content: string; is_admin: boolean; created_at: string; user: { name: string | null; nickname: string | null; role: string } }

export default function SupportClient({
    notices, initialTab, isAdmin, currentUserId
}: {
    notices: Notice[]; initialTab: string; isAdmin: boolean; currentUserId: string | null
}) {
    const router = useRouter()
    const { showError, showSuccess } = useModal()
    const [activeTab, setActiveTab] = useState(initialTab)
    const [qas, setQas] = useState<QA[]>([])
    const [loadingQas, setLoadingQas] = useState(false)
    const [notLoggedIn, setNotLoggedIn] = useState(false)

    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
    const [selectedQA, setSelectedQA] = useState<QA | null>(null)
    const [comments, setComments] = useState<QAComment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentInput, setCommentInput] = useState('')
    const [sendingComment, setSendingComment] = useState(false)
    const commentsEndRef = useRef<HTMLDivElement>(null)

    const [showWriteModal, setShowWriteModal] = useState(false)
    const [form, setForm] = useState({ title: '', content: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchQas = async () => {
        setLoadingQas(true); setNotLoggedIn(false)
        try {
            const res = await fetch('/api/support/qa')
            if (res.status === 401) { setNotLoggedIn(true); return }
            const data = await res.json()
            if (Array.isArray(data)) setQas(data)
        } finally { setLoadingQas(false) }
    }

    const fetchComments = async (qaId: string) => {
        setLoadingComments(true)
        try {
            const res = await fetch(`/api/support/qa/${qaId}/comments`)
            if (res.ok) { const data = await res.json(); setComments(data) }
        } finally { setLoadingComments(false) }
    }

    useEffect(() => { if (activeTab === 'qa') fetchQas() }, [activeTab])

    useEffect(() => {
        if (selectedQA) {
            fetchComments(selectedQA.id)
            setCommentInput('')
        } else {
            setComments([])
        }
    }, [selectedQA])

    useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

    const openQA = (qa: QA) => {
        setSelectedQA(qa)
        // Update is_answer locally if there are comments
        setQas(prev => prev)
    }

    const handleSendComment = async () => {
        if (!selectedQA || !commentInput.trim()) return
        setSendingComment(true)
        try {
            const res = await fetch(`/api/support/qa/${selectedQA.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentInput })
            })
            if (!res.ok) { const d = await res.json(); showError(translateError(d.error || '오류')); return }
            const newComment: QAComment = await res.json()
            setComments(prev => [...prev, newComment])
            setCommentInput('')
            // Mark QA as answered if admin replied
            if (isAdmin) {
                setQas(prev => prev.map(q => q.id === selectedQA.id ? { ...q, is_answer: true } : q))
                setSelectedQA(prev => prev ? { ...prev, is_answer: true } : null)
            }
        } finally { setSendingComment(false) }
    }

    const handleStartQnAChat = async () => {
        if (notLoggedIn) { showError('로그인이 필요합니다.'); return }
        setLoadingQas(true)
        try {
            const res = await fetch('/api/chat/qna', { method: 'POST' })
            if (res.status === 401) { showError('로그인이 필요합니다.'); return }
            const data = await res.json()
            if (data.roomId) {
                router.push(`/messages/${data.roomId}`)
            } else {
                showError(data.error || '채팅방 연결 중 오류가 발생했습니다.')
            }
        } catch (error) {
            showError('서버 통신 오류가 발생했습니다.')
        } finally {
            setLoadingQas(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg">
            {/* Sticky Header - Unified Style */}
            {/* 
            <div className="w-full bg-white dark:bg-dark-card border-b border-gray-50 dark:border-dark-border sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push('/')} className="text-gray-900 dark:text-gray-100 p-2 -ml-2 mr-0.5 hover:text-gray-900 dark:hover:text-white transition active:scale-95">
                            <ChevronLeft size={24} />
                        </button>
                        <HeadphonesIcon size={18} className="text-amber-500" />
                        <h1 className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">고객센터</h1>
                    </div>
                    {activeTab === 'qa' && !notLoggedIn && (
                        <button
                            onClick={handleStartQnAChat}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-dark-bg px-4 py-1.5 rounded-full font-black text-[12px] active:scale-95 transition-all shadow-lg shadow-gray-100 dark:shadow-none"
                        >
                            문의하기
                        </button>
                    )}
                </div>
            </div>
            */}

            <div className="max-w-2xl mx-auto py-8 px-4">

                <div className="flex border-b border-gray-100 dark:border-dark-border mb-8 bg-gray-50/50 dark:bg-dark-card/50 rounded-t-2xl overflow-hidden">
                    {(['notice', 'qa'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 flex items-center justify-center gap-2 py-5 text-[15px] font-black transition-all border-b-4 ${activeTab === tab ? 'border-amber-500 text-amber-500 bg-white dark:bg-dark-card' : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                            {tab === 'notice' ? <Megaphone size={16} /> : <MessageCircleQuestion size={16} />}
                            {tab === 'notice' ? '공지사항' : 'Q&A'}
                        </button>
                    ))}
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'notice' && (
                        <div className="space-y-3">
                            {notices.length === 0 ? <div className="p-20 text-center text-gray-300 font-bold">등록된 공지사항이 없습니다.</div>
                                : notices.map(n => (
                                    <button key={n.id} onClick={() => setSelectedNotice(n)}
                                        className="w-full text-left bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-[24px] px-6 py-4 hover:shadow-md hover:border-amber-100 transition-all flex items-start gap-3">
                                        {n.is_important && <span className="flex-shrink-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black mt-0.5">중요</span>}
                                        <span className="flex-1 font-black text-gray-800 dark:text-gray-200 text-[15px] leading-snug break-keep">{n.title}</span>
                                        <span className="text-[11px] text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</span>
                                    </button>
                                ))}
                        </div>
                    )}

                    {activeTab === 'qa' && (
                        <div className="py-12 px-6 bg-gray-50 dark:bg-dark-card/30 rounded-[32px] text-center border border-dashed border-gray-200 dark:border-dark-border">
                            <div className="w-20 h-20 bg-amber-50 dark:bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageCircleQuestion size={40} className="text-amber-500" />
                            </div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-3">1:1 실시간 채팅 상담</h2>
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-bold mb-8 leading-relaxed">
                                궁금하신 점이나 불편한 사항이 있으신가요?<br />
                                관리자와 1:1로 가장 빠르게 대화하실 수 있습니다.
                            </p>
                            <button
                                onClick={handleStartQnAChat}
                                disabled={loadingQas}
                                className="w-full max-w-sm py-4 bg-amber-500 text-white rounded-2xl font-black text-[15px] shadow-lg shadow-amber-100 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 mx-auto"
                            >
                                {loadingQas ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        상담 시작하기
                                    </>
                                )}
                            </button>
                            <p className="mt-6 text-[10px] text-gray-300 dark:text-gray-600 font-bold uppercase tracking-widest">
                                Premium Support Service
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-20 p-10 bg-gray-50 dark:bg-dark-card rounded-[40px] text-center border border-gray-100 dark:border-dark-border">
                    <h3 className="text-lg font-black text-gray-500 dark:text-gray-400 mb-2">상담이 필요하신가요?</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold mb-6">전화 또는 문자로 문의주시면 친절히 안내드립니다.</p>
                    <div className="flex flex-col gap-2">
                        <a href="tel:1899-0930" className="text-3xl font-black text-amber-500 hover:text-amber-600 transition-colors">1899-0930</a>
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold">평일 11:00 ~ 20:00 (주말/공휴일 휴무)</p>
                    </div>
                </div>
            </div>

            {/* ─── 공지사항 팝업 ─── */}
            {selectedNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNotice(null)}>
                    <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50 dark:border-dark-border">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                {selectedNotice.is_important && <span className="flex-shrink-0 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full mt-0.5">중요</span>}
                                <h3 className="font-black text-gray-900 dark:text-gray-100 text-[17px] leading-snug break-keep">{selectedNotice.title}</h3>
                            </div>
                            <button onClick={() => setSelectedNotice(null)} className="flex-shrink-0 ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-400 dark:text-gray-500"><X size={18} /></button>
                        </div>
                        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                            <p className="text-[11px] text-gray-300 dark:text-gray-600 mb-4">{new Date(selectedNotice.created_at).toLocaleDateString()}</p>
                            <div
                                className="text-[14px] sm:text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-keep space-y-3"
                                dangerouslySetInnerHTML={{ __html: selectedNotice.content }}
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    const anchor = target.closest('a');
                                    if (anchor && anchor.href) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(anchor.href, '_blank', 'noopener,noreferrer');
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Q&A 댓글 팝업 ─── */}
            {selectedQA && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedQA(null)}>
                    <div className="bg-white dark:bg-dark-card w-full max-w-lg sm:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50 dark:border-dark-border flex-shrink-0">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                {selectedQA.is_answer
                                    ? <span className="flex-shrink-0 text-[10px] font-black bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full mt-0.5">답변완료</span>
                                    : <span className="flex-shrink-0 text-[10px] font-black bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full mt-0.5">답변대기</span>}
                                <h3 className="font-black text-gray-900 dark:text-gray-100 text-[16px] leading-snug break-keep">{selectedQA.title}</h3>
                            </div>
                            <button onClick={() => setSelectedQA(null)} className="flex-shrink-0 ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-400 dark:text-gray-500"><X size={18} /></button>
                        </div>

                        {/* Original Q content */}
                        <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border flex-shrink-0 bg-gray-50/50 dark:bg-dark-bg/50">
                            <p className="text-[11px] text-gray-300 dark:text-gray-600 mb-1.5">
                                {selectedQA.user.nickname || selectedQA.user.name || '익명'} · {new Date(selectedQA.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-keep">{selectedQA.content}</p>
                        </div>

                        {/* Comments thread */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
                            {loadingComments ? (
                                <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : comments.length === 0 ? (
                                <p className="text-center text-gray-300 text-sm font-bold py-6">아직 댓글이 없습니다.</p>
                            ) : comments.map(c => (
                                <div key={c.id} className={`flex gap-2.5 ${c.is_admin ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${c.is_admin ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400'}`}>
                                        {c.is_admin ? <ShieldCheck size={14} /> : (c.user.nickname || c.user.name || '?')[0]}
                                    </div>
                                    {/* Bubble */}
                                    <div className={`max-w-[75%] ${c.is_admin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <span className={`text-[10px] font-black ${c.is_admin ? 'text-amber-400 dark:text-amber-500 text-right' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {c.is_admin ? '관리자' : (c.user.nickname || c.user.name || '익명')}
                                        </span>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-keep ${c.is_admin ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                                            {c.content}
                                        </div>
                                        <span className="text-[10px] text-gray-300 dark:text-gray-600">
                                            {new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={commentsEndRef} />
                        </div>

                        {/* Comment input */}
                        <div className="px-5 pb-5 pt-3 border-t border-gray-50 dark:border-dark-border flex-shrink-0">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    value={commentInput}
                                    onChange={e => setCommentInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment() } }}
                                    placeholder={isAdmin ? '답변을 입력하세요... (Enter = 전송)' : '추가 문의를 입력하세요... (Enter = 전송)'}
                                    rows={2}
                                    className="flex-1 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-500/20 placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"
                                />
                                <button
                                    onClick={handleSendComment}
                                    disabled={sendingComment || !commentInput.trim()}
                                    className="flex-shrink-0 w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-40"
                                >
                                    {sendingComment ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                            {isAdmin && <p className="text-[10px] text-amber-400 dark:text-amber-500 font-bold mt-1.5">✓ 관리자로 답변 시 자동으로 '답변완료' 처리됩니다</p>}
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
