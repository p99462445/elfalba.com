'use client'
import React, { useState } from 'react'
import { Phone, CheckCircle2 } from 'lucide-react'
import { useModal } from '@/providers/ModalProvider'
import { translateError } from '@/lib/utils/error-translator'

export function ApplyButton({ jobId, contactInfo }: { jobId: string, contactInfo: string }) {
    const [isApplying, setIsApplying] = useState(false)
    const [hasApplied, setHasApplied] = useState(false)
    const { showError, showSuccess } = useModal()

    const handleApply = async () => {
        setIsApplying(true)
        try {
            const res = await fetch('/api/jobs/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setHasApplied(true)
            showSuccess("지원이 완료되었습니다!")
        } catch (err: any) {
            if (err.message === '로그인이 필요합니다.') {
                window.location.href = '/login'
            } else {
                showError(translateError(err))
            }
        } finally {
            setIsApplying(false)
        }
    }

    if (hasApplied) {
        return (
            <div className="flex-1 bg-green-600 flex items-center justify-center gap-2 rounded-2xl font-black text-white text-sm">
                <CheckCircle2 size={18} /> 지원 완료됨
            </div>
        )
    }

    return (
        <button
            onClick={handleApply}
            disabled={isApplying}
            className="flex-1 bg-gradient-to-r from-purple-600 to-amber-600 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 rounded-2xl font-black text-white text-sm transition shadow-lg shadow-purple-500/20"
        >
            <Phone size={18} /> {isApplying ? '지원 중...' : '전화 바로 지원하기'}
        </button>
    )
}
