'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Camera, Check, X } from 'lucide-react';

interface Props {
    initialData?: any;
    regions: string[];
    categories: string[];
}

export default function ResumeFormClient({ initialData, regions, categories }: Props) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        nickname: initialData?.nickname || '',
        age: initialData?.age || '',
        region: initialData?.region || '',
        occupation: initialData?.occupation || '',
        content: initialData?.content || '',
        images: initialData?.images?.map((img: any) => img.image_url) || []
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, upload to Supabase Storage. Here we simulate with Base64 or a mock URL.
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, reader.result as string].slice(0, 4) // Max 4 photos
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((unused: string, i: number) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!formData.content) {
            alert('자기소개 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/resumes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                router.push('/밤알바구인구직');
                router.refresh();
            } else {
                alert('저장에 실패했습니다: ' + data.error);
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white dark:bg-dark-bg relative">
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-gray-50 dark:border-dark-border">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 dark:text-gray-400">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-black text-gray-900 dark:text-gray-100">이력서 작성</h1>
                <div className="w-10" />
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Photo Upload */}
                <div className="space-y-3">
                    <label className="text-[14px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Profile Photos</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <label className="shrink-0 w-20 h-20 bg-gray-50 dark:bg-dark-card border-2 border-dashed border-gray-200 dark:border-dark-border rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-amber-300 transition-all">
                            <Camera size={20} />
                            <span className="text-[10px] font-black mt-1">{formData.images.length}/4</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                        {formData.images.map((img: string, i: number) => (
                            <div key={i} className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border shadow-sm group">
                                <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition">
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nickname & Age */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Nickname</label>
                        <input 
                            type="text" 
                            value={formData.nickname}
                            onChange={e => setFormData({...formData, nickname: e.target.value})}
                            placeholder="별명을 입력하세요"
                            className="w-full h-12 px-4 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Age</label>
                        <input 
                            type="number" 
                            value={formData.age}
                            onChange={e => setFormData({...formData, age: e.target.value})}
                            placeholder="나이"
                            className="w-full h-12 px-4 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>

                {/* Region & Category */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Region</label>
                        <select 
                            value={formData.region}
                            onChange={e => setFormData({...formData, region: e.target.value})}
                            className="w-full h-12 px-4 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                        >
                            <option value="">지역 선택</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Occupation</label>
                        <select 
                            value={formData.occupation}
                            onChange={e => setFormData({...formData, occupation: e.target.value})}
                            className="w-full h-12 px-4 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                        >
                            <option value="">직종 선택</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Self Introduction</label>
                    <textarea 
                        rows={8}
                        value={formData.content}
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        placeholder="본인의 강점이나 희망사항을 자유롭게 작성해 주세요"
                        className="w-full p-4 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed resize-none"
                    />
                </div>

                <div className="pt-4">
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-amber-500 text-white rounded-[24px] font-black text-[17px] flex items-center justify-center gap-2 shadow-xl shadow-amber-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? '저장 중...' : (initialData ? '이력서 수정 완료' : '이력서 등록하기')}
                        <Check size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}
