'use client'
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { X, CheckCircle2, AlertCircle, Info, Trash2 } from 'lucide-react'

type ModalType = 'alert' | 'confirm' | 'success' | 'error' | 'warning' | 'delete'

interface ModalOptions {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    onCancel?: () => void
}

interface ModalContextType {
    showModal: (type: ModalType, options: ModalOptions) => void
    hideModal: () => void
    showAlert: (message: string, onConfirm?: () => void) => void
    showSuccess: (message: string, onConfirm?: () => void) => void
    showError: (message: string, onConfirm?: () => void) => void
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModal = () => {
    const context = useContext(ModalContext)
    if (!context) throw new Error('useModal must be used within a ModalProvider')
    return context
}

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [type, setType] = useState<ModalType>('alert')
    const [options, setOptions] = useState<ModalOptions>({ message: '' })

    const hideModal = useCallback(() => {
        setIsOpen(false)
        if (options.onCancel) options.onCancel()
    }, [options])

    const handleConfirm = useCallback(() => {
        setIsOpen(false)
        if (options.onConfirm) options.onConfirm()
    }, [options])

    const showModal = useCallback((type: ModalType, opts: ModalOptions) => {
        setType(type)
        setOptions(opts)
        setIsOpen(true)
    }, [])

    const showAlert = useCallback((message: string, onConfirm?: () => void) => {
        showModal('alert', { message, onConfirm })
    }, [showModal])

    const showSuccess = useCallback((message: string, onConfirm?: () => void) => {
        showModal('success', { message, onConfirm })
    }, [showModal])

    const showError = useCallback((message: string, onConfirm?: () => void) => {
        showModal('error', { message, onConfirm })
    }, [showModal])

    const showConfirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
        showModal('confirm', { message, onConfirm, onCancel })
    }, [showModal])

    return (
        <ModalContext.Provider value={{ showModal, hideModal, showAlert, showSuccess, showError, showConfirm }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
                    <div className="bg-[#1A1A1A] w-full max-w-[340px] rounded-[40px] overflow-hidden shadow-2xl p-8 text-center border border-white/5 animate-in zoom-in-95 duration-300">
                        {/* Status Icon */}
                        <div className="mx-auto mb-6 flex items-center justify-center">
                            {type === 'success' && <CheckCircle2 size={56} className="text-emerald-400" />}
                            {(type === 'error' || type === 'alert') && <AlertCircle size={56} className="text-amber-500" />}
                            {type === 'confirm' && <Info size={56} className="text-blue-400" />}
                            {type === 'delete' && <Trash2 size={56} className="text-red-500" />}
                        </div>

                        {options.title && (
                            <h3 className="text-[20px] font-black text-white mb-2 leading-tight tracking-tight">
                                {options.title}
                            </h3>
                        )}

                        <div className="text-[15px] font-medium text-gray-400 mb-8 leading-relaxed whitespace-pre-wrap break-keep">
                            {options.message}
                        </div>

                        <div className="flex gap-3">
                            {(type === 'confirm' || type === 'delete') && (
                                <button
                                    onClick={hideModal}
                                    className="flex-1 h-14 bg-white/5 hover:bg-white/10 active:scale-[0.97] text-gray-300 rounded-[24px] font-bold text-[16px] transition-all"
                                >
                                    {options.cancelText || '취소'}
                                </button>
                            )}
                            <button
                                onClick={handleConfirm}
                                className={`flex-[2] h-14 ${type === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'} active:scale-[0.97] text-white rounded-[24px] font-black text-[17px] transition-all shadow-lg shadow-amber-500/20`}
                            >
                                {options.confirmText || '확인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    )
}
