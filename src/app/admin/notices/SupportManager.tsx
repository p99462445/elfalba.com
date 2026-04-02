'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit3, Bell, HelpCircle, Save, X, MessageCircleQuestion, CheckCircle, ShieldCheck, Send } from 'lucide-react'

interface QAComment { id: string; content: string; is_admin: boolean; created_at: string; user: { name: string | null; nickname: string | null; role: string } }

export default function SupportManager({ initialNotices, initialFaqs }: { initialNotices: any[], initialFaqs: any[] }) {
    const [tab, setTab] = useState<'NOTICE' | 'FAQ' | 'QA'>('NOTICE')
    const [notices, setNotices] = useState(initialNotices)
    const [faqs, setFaqs] = useState(initialFaqs)
    const [qas, setQas] = useState<any[]>([])
    const [loadingQas, setLoadingQas] = useState(false)

    const [isEditing, setIsEditing] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)

    const [selectedQA, setSelectedQA] = useState<any>(null)
    const [comments, setComments] = useState<QAComment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [commentInput, setCommentInput] = useState('')
    const [sendingComment, setSendingComment] = useState(false)
    const commentsEndRef = useRef<HTMLDivElement>(null)

    const fetchQas = async () => {
        setLoadingQas(true)
        try {
            const res = await fetch('/api/support/qa')
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

    useEffect(() => { if (tab === 'QA') fetchQas() }, [tab])
    useEffect(() => {
        if (selectedQA) { fetchComments(selectedQA.id); setCommentInput('') }
        else { setComments([]) }
    }, [selectedQA])
    useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

    const handleSendComment = async () => {
        if (!selectedQA || !commentInput.trim()) return
        setSendingComment(true)
        try {
            const res = await fetch(`/api/support/qa/${selectedQA.id}/comments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentInput })
            })
            if (!res.ok) { alert('전송 실패'); return }
            const newComment: QAComment = await res.json()
            setComments(prev => [...prev, newComment])
            setCommentInput('')
            // Mark as answered
            setQas(prev => prev.map(q => q.id === selectedQA.id ? { ...q, is_answer: true } : q))
            setSelectedQA((prev: any) => prev ? { ...prev, is_answer: true } : null)
        } finally { setSendingComment(false) }
    }

    const handleOpenEditor = (item: any = null) => {
        setEditItem(item || (tab === 'NOTICE' ? { title: '', content: '', is_important: false } : { question: '', answer: '', category: '일반', order: 0 }))
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!editItem) return
        const method = editItem.id ? 'PATCH' : 'POST'
        try {
            const res = await fetch('/api/admin/support', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editItem, type: tab }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            if (editItem.id) {
                if (tab === 'NOTICE') setNotices((prev: any[]) => prev.map(n => n.id === data.id ? data : n))
                else setFaqs((prev: any[]) => prev.map(f => f.id === data.id ? data : f))
            } else {
                if (tab === 'NOTICE') setNotices((prev: any[]) => [data, ...prev])
                else setFaqs((prev: any[]) => [...prev, data].sort((a, b) => a.order - b.order))
            }
            setIsEditing(false); setEditItem(null); alert('저장되었습니다.')
        } catch (err: any) { alert(err.message) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        try {
            const res = await fetch(`/api/admin/support?id=${id}&type=${tab}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('삭제 실패')
            if (tab === 'NOTICE') setNotices((prev: any[]) => prev.filter(n => n.id !== id))
            else setFaqs((prev: any[]) => prev.filter(f => f.id !== id))
            alert('삭제되었습니다.')
        } catch (err: any) { alert(err.message) }
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
                {([['NOTICE', '공지사항', <Bell size={18} />], ['FAQ', 'FAQ', <HelpCircle size={18} />], ['QA', 'Q&A 문의', <MessageCircleQuestion size={18} />]] as const).map(([t, label, icon]) => (
                    <button key={t} onClick={() => setTab(t as any)}
                        className={`px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 ${tab === t ? 'bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white shadow-lg dark:shadow-none scale-105' : 'bg-white dark:bg-dark-card text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-dark-border'}`}>
                        {icon}{label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-dark-card shadow-soft dark:shadow-none rounded-3xl border border-gray-100 dark:border-dark-border overflow-hidden">
                <div className="p-6 border-b border-gray-50 dark:border-dark-border flex justify-between items-center bg-gray-50/30 dark:bg-dark-bg/30">
                    <h2 className="text-lg font-black text-gray-800 dark:text-gray-100">
                        {tab === 'NOTICE' ? '공지사항 목록' : tab === 'FAQ' ? 'FAQ 목록' : 'Q&A 문의 목록'}
                    </h2>
                    {tab !== 'QA' && (
                        <button onClick={() => handleOpenEditor()} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg dark:shadow-none shadow-amber-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                            <Plus size={14} /> 신규 등록
                        </button>
                    )}
                </div>

                <div className="divide-y divide-gray-50 dark:divide-dark-bg">
                    {tab === 'NOTICE' && notices.map((n: any) => (
                        <div key={n.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors group">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {n.is_important && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-black">중요</span>}
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{n.title}</h3>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEditor(n)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500"><Edit3 size={18} /></button>
                                <button onClick={() => handleDelete(n.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}

                    {tab === 'FAQ' && faqs.map((f: any) => (
                        <div key={f.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors group">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded font-black">{f.category}</span>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Q. {f.question}</h3>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{f.answer}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEditor(f)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500"><Edit3 size={18} /></button>
                                <button onClick={() => handleDelete(f.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}

                    {tab === 'QA' && (
                        loadingQas ? (
                            <div className="p-20 flex justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                        ) : qas.length === 0 ? (
                            <div className="p-20 text-center text-gray-300 dark:text-gray-700 font-bold">접수된 Q&A가 없습니다.</div>
                        ) : qas.map((qa: any) => (
                            <button key={qa.id} onClick={() => setSelectedQA(qa)} className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {qa.is_answer
                                            ? <span className="text-[10px] font-black bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle size={10} className="mr-0.5" />답변완료</span>
                                            : <span className="text-[10px] font-black bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">답변대기</span>}
                                        <span className="text-[10px] text-gray-300 dark:text-gray-700">{new Date(qa.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="font-black text-gray-800 dark:text-gray-100 text-[15px] truncate">{qa.title}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{qa.user?.nickname || qa.user?.name || '익명'}</p>
                                </div>
                            </button>
                        ))
                    )}

                    {((tab === 'NOTICE' && notices.length === 0) || (tab === 'FAQ' && faqs.length === 0)) && (
                        <div className="p-20 text-center text-gray-300 dark:text-gray-700 font-bold">등록된 항목이 없습니다.</div>
                    )}
                </div>
            </div>

            {/* Notice/FAQ Editor Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/50">
                            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">{editItem?.id ? '수정' : '신규 등록'}</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 p-1"><X size={24} /></button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6">
                            {tab === 'NOTICE' ? (
                                <>
                                    <input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-amber-300 text-gray-900 dark:text-gray-100" placeholder="공지사항 제목" />
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="is_imp" checked={editItem.is_important} onChange={e => setEditItem({ ...editItem, is_important: e.target.checked })} className="w-4 h-4" />
                                        <label htmlFor="is_imp" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">중요 공지로 고정</label>
                                    </div>
                                    <textarea value={editItem.content} onChange={e => setEditItem({ ...editItem, content: e.target.value })} rows={12} className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-amber-300 resize-none text-gray-900 dark:text-gray-100" placeholder="공지 내용" />
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={editItem.category} onChange={e => setEditItem({ ...editItem, category: e.target.value })} className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-5 py-4 text-sm font-bold outline-none text-gray-900 dark:text-gray-100">
                                            <option>일반</option><option>계정/보안</option><option>업소/사장님</option><option>결제/정산</option><option>신고/제재</option>
                                        </select>
                                        <input type="number" value={editItem.order} onChange={e => setEditItem({ ...editItem, order: parseInt(e.target.value) })} className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-5 py-4 text-sm font-bold outline-none text-gray-900 dark:text-gray-100" placeholder="순서" />
                                    </div>
                                    <input value={editItem.question} onChange={e => setEditItem({ ...editItem, question: e.target.value })} className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-5 py-4 text-sm font-bold outline-none text-gray-900 dark:text-gray-100" placeholder="질문 내용" />
                                    <textarea value={editItem.answer} onChange={e => setEditItem({ ...editItem, answer: e.target.value })} rows={8} className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-5 py-4 text-sm outline-none resize-none text-gray-900 dark:text-gray-100" placeholder="답변 내용" />
                                </>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-50 dark:border-dark-border bg-gray-50/30 dark:bg-dark-bg/30 flex gap-3">
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-4 rounded-2xl text-sm font-black text-gray-400 dark:text-gray-500">취소</button>
                            <button onClick={handleSave} className="flex-[2] py-4 bg-gray-900 dark:bg-gray-100 dark:text-dark-bg text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2"><Save size={18} /> 저장하기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* QA Comments Popup (Admin) */}
            {selectedQA && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedQA(null)}>
                    <div className="bg-white dark:bg-dark-card w-full max-w-lg sm:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50 dark:border-dark-border flex-shrink-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {selectedQA.is_answer
                                    ? <span className="flex-shrink-0 text-[10px] font-black bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">답변완료</span>
                                    : <span className="flex-shrink-0 text-[10px] font-black bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">답변대기</span>}
                                <h3 className="font-black text-gray-900 dark:text-gray-100 text-[16px] truncate">{selectedQA.title}</h3>
                            </div>
                            <button onClick={() => setSelectedQA(null)} className="flex-shrink-0 ml-2 p-2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"><X size={20} /></button>
                        </div>

                        {/* Original content */}
                        <div className="px-5 py-4 border-b border-gray-50 dark:border-dark-border flex-shrink-0 bg-gray-50/50 dark:bg-dark-bg/50">
                            <p className="text-[11px] text-gray-300 dark:text-gray-700 mb-1.5">{selectedQA.user?.nickname || selectedQA.user?.name || '익명'} · {new Date(selectedQA.created_at).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedQA.content}</p>
                        </div>

                        {/* Comments thread */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
                            {loadingComments ? (
                                <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                            ) : comments.length === 0 ? (
                                <p className="text-center text-gray-300 dark:text-gray-700 text-sm font-bold py-6">아직 댓글이 없습니다.</p>
                            ) : comments.map(c => (
                                <div key={c.id} className={`flex gap-2.5 ${c.is_admin ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${c.is_admin ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400'}`}>
                                        {c.is_admin ? <ShieldCheck size={14} /> : (c.user.nickname || c.user.name || '?')[0]}
                                    </div>
                                    <div className={`max-w-[75%] flex flex-col gap-1 ${c.is_admin ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-[10px] font-black ${c.is_admin ? 'text-amber-400' : 'text-gray-400'}`}>
                                            {c.is_admin ? '관리자' : (c.user.nickname || c.user.name || '익명')}
                                        </span>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${c.is_admin ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}>
                                            {c.content}
                                        </div>
                                        <span className="text-[10px] text-gray-300 dark:text-gray-700">{new Date(c.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={commentsEndRef} />
                        </div>

                        {/* Admin comment input */}
                        <div className="px-5 pb-5 pt-3 border-t border-gray-50 dark:border-dark-border flex-shrink-0">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    value={commentInput}
                                    onChange={e => setCommentInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment() } }}
                                    placeholder="답변을 입력하세요... (Enter = 전송, Shift+Enter = 줄바꿈)"
                                    rows={2}
                                    className="flex-1 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-2xl px-4 py-3 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none"
                                />
                                <button onClick={handleSendComment} disabled={sendingComment || !commentInput.trim()}
                                    className="flex-shrink-0 w-11 h-11 bg-amber-500 text-white rounded-2xl flex items-center justify-center hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-40 shadow-lg dark:shadow-none">
                                    {sendingComment ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-amber-400 font-bold mt-1.5">✓ 답변 시 자동으로 '답변완료' 처리됩니다</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
