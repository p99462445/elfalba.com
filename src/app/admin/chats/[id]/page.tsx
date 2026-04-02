import React from 'react'
import prisma from '@/lib/prisma'
import { ArrowLeft, User, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function AdminChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const room = await prisma.chatRoom.findUnique({
        where: { id },
        include: {
            user1: { select: { id: true, nickname: true, email: true, role: true } },
            user2: { select: { id: true, nickname: true, email: true, role: true } },
            messages: {
                orderBy: { created_at: 'asc' },
                include: { sender: { select: { id: true, nickname: true, email: true } } }
            }
        }
    })

    if (!room) {
        return (
            <div className="p-12 text-center bg-white dark:bg-dark-card rounded-xl shadow dark:shadow-none">
                <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">대화방을 찾을 수 없습니다.</h2>
                <Link href="/admin/chats" className="mt-4 text-blue-500 hover:underline inline-block">목록으로 돌아가기</Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/chats" className="p-2 hover:bg-white dark:hover:bg-dark-bg rounded-full transition-colors bg-white dark:bg-dark-card shadow-sm dark:shadow-none text-gray-700 dark:text-gray-300">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">대화 내역 조회</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {room.id}</p>
                </div>
            </div>

            {/* Room Info Card */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm dark:shadow-none border-l-4 border-blue-500">
                    <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 mb-2">User 1</p>
                    <div className="flex justify-between items-center">
                        <span className="font-black text-gray-800 dark:text-gray-100 text-lg">{room.user1.nickname || '익명'}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-bg rounded text-gray-500 dark:text-gray-400">{room.user1.role}</span>
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{room.user1.email}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm dark:shadow-none border-l-4 border-amber-500">
                    <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 mb-2">User 2</p>
                    <div className="flex justify-between items-center">
                        <span className="font-black text-gray-800 dark:text-gray-100 text-lg">{room.user2.nickname || '익명'}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-bg rounded text-gray-500 dark:text-gray-400">{room.user2.role}</span>
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{room.user2.email}</p>
                </div>
            </div>

            {/* Chat History List */}
            <div className="bg-gray-50 dark:bg-dark-bg/50 rounded-2xl p-6 border border-gray-100 dark:border-dark-border min-h-[500px] flex flex-col gap-6">
                {room.messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold">
                        기록된 메시지가 없습니다.
                    </div>
                ) : (
                    room.messages.map((msg) => {
                        const isUser1 = msg.sender_id === room.user1_id
                        return (
                            <div key={msg.id} className={`flex ${isUser1 ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[70%] ${isUser1 ? 'bg-white dark:bg-dark-card text-gray-800 dark:text-gray-100' : 'bg-amber-500 text-white'} p-4 rounded-2xl shadow-sm dark:shadow-none relative`}>
                                    <div className={`text-[10px] mb-1 font-black opacity-60 flex gap-2 items-center text-gray-500 dark:text-gray-400`}>
                                        <span>{msg.sender.nickname || '익명'}</span>
                                        <span className="opacity-40">|</span>
                                        <span>{msg.sender.email}</span>
                                    </div>
                                    <p className="text-[15px] font-bold leading-relaxed">{msg.content}</p>
                                    <p className="text-[9px] mt-2 opacity-50 text-right">
                                        {format(new Date(msg.created_at), 'yyyy/MM/dd HH:mm:ss', { locale: ko })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
