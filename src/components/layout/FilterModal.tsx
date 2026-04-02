'use client'
import React, { useEffect, useState } from 'react'
import { X, Check } from 'lucide-react'

interface FilterModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export default function FilterModal({ isOpen, onClose, title, children }: FilterModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-400 ease-out border-all border-gray-100 dark:border-dark-border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 dark:border-dark-border">
                    <h3 className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Scrollable if content is long) */}
                <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
                    {children}
                </div>

                {/* Handle for Mobile Bottom Sheet Style (Optional visualization) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 sm:hidden" />
            </div>
        </div>
    )
}
