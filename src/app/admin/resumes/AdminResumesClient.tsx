'use client'
import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2, ExternalLink, Save, CheckCircle2 } from 'lucide-react';

export default function AdminResumesClient() {
    const [resumes, setResumes] = useState<any[]>([]);
    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingNotice, setIsSavingNotice] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rRes, nRes] = await Promise.all([
                fetch('/api/resumes'),
                fetch('/api/resumes/notice')
            ]);
            const [rData, nData] = await Promise.all([rRes.json(), nRes.json()]);
            setResumes(rData);
            setNotice(nData.content || '');
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveNotice = async () => {
        setIsSavingNotice(true);
        setSaveSuccess(false);
        try {
            const res = await fetch('/api/resumes/notice', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: notice })
            });
            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (err) {
            alert('공지 저장 실패');
        } finally {
            setIsSavingNotice(false);
        }
    };

    const handleDeleteResume = async (id: string) => {
        if (!confirm('정말 이 이력서를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setResumes(resumes.filter(r => r.id !== id));
            }
        } catch (err) {
            alert('삭제 실패');
        }
    };

    if (isLoading) return <div className="p-20 text-center font-bold text-gray-400">로딩 중...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Notice Editor */}
            <div className="lg:col-span-1 space-y-6">
                <section className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Megaphone className="text-amber-500" size={20} />
                        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">이력서 상단 공지</h2>
                    </div>
                    <textarea 
                        value={notice}
                        onChange={(e) => setNotice(e.target.value)}
                        className="w-full h-40 p-4 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                        placeholder="이력서 목록 상단에 노출될 안내 문구를 입력하세요."
                    />
                    <button 
                        onClick={handleSaveNotice}
                        disabled={isSavingNotice}
                        className="mt-4 w-full h-12 bg-amber-500 text-white rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                        {isSavingNotice ? '저장 중...' : (saveSuccess ? '저장 완료!' : '공지사항 수정하기')}
                    </button>
                </section>
            </div>

            {/* Right: Resume List */}
            <div className="lg:col-span-2 space-y-6">
                <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-dark-border">
                        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">등록된 이력서 목록 ({resumes.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-dark-bg text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">구직자</th>
                                    <th className="px-6 py-4">정보 (나이/지역/직종)</th>
                                    <th className="px-6 py-4">등록일</th>
                                    <th className="px-6 py-4 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                                {resumes.map((resume) => (
                                    <tr key={resume.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-bg/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-bg overflow-hidden shrink-0 border border-gray-100 dark:border-dark-border">
                                                    {resume.thumbnail ? (
                                                        <img src={resume.thumbnail} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Trash2 size={14} /></div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-black text-gray-900 dark:text-gray-100">{resume.nickname}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[13px] font-bold text-gray-600 dark:text-gray-400">
                                                {resume.age}세 / {resume.region} / {resume.occupation}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[12px] text-gray-400 font-medium">
                                            {new Date(resume.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <a href={`/밤알바구인구직/${resume.id}`} target="_blank" className="inline-flex p-2 text-gray-400 hover:text-amber-500 transition-colors">
                                                <ExternalLink size={18} />
                                            </a>
                                            <button onClick={() => handleDeleteResume(resume.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {resumes.length === 0 && (
                            <div className="py-20 text-center text-gray-400 font-bold">등록된 이력서가 없습니다.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
