import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const isAdmin = user?.user_metadata?.role === 'ADMIN' || user?.email === '1@gmail.com'
        if (!isAdmin) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
        }

        const { startDate, endDate, statuses } = await req.json()

        const gte = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const lte = endDate ? new Date(endDate) : new Date()
        lte.setHours(23, 59, 59, 999) // end of day

        // Fetch all matching payments
        const payments = await prisma.payment.findMany({
            where: {
                created_at: {
                    gte,
                    lte
                },
                status: statuses && statuses.length > 0 ? { in: statuses } : undefined
            },
            include: { user: true }
        })

        // Also fetch user's first payment date before 'gte' to determine if NEW or REPEAT
        const userIds = [...new Set(payments.map(p => p.user_id))]
        const previousPayments = await prisma.payment.groupBy({
            by: ['user_id'],
            where: {
                user_id: { in: userIds },
                created_at: { lt: gte },
                status: 'APPROVED'
            },
            _count: {
                id: true
            }
        })

        const repeatUsers = new Set(previousPayments.map(p => p.user_id))

        // Grouping variables
        const daysTracker: Record<string, any> = {}

        for (const p of payments) {
            const dateStr = p.created_at.toISOString().split('T')[0]
            if (!daysTracker[dateStr]) {
                const parts = dateStr.split('-')
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                const days = ['일', '월', '화', '수', '목', '금', '토']
                const dayStr = days[d.getDay()]

                daysTracker[dateStr] = {
                    date: dateStr,
                    dayStr: dayStr,
                    newCount: 0,
                    newAmount: 0,
                    repeatCount: 0,
                    repeatAmount: 0,
                    totalCount: 0,
                    totalAmount: 0,
                    bankAmount: 0,
                    pgAmount: 0
                }
            }

            const row = daysTracker[dateStr]

            // Mark as repeat if user had previous payments before the range, 
            // OR if they already made a payment earlier within this range.
            let isRepeat = false
            if (repeatUsers.has(p.user_id)) {
                isRepeat = true
            } else {
                // Determine if this is the first payment in the current range
                const usersPaymentsPriorToThisInRange = payments.filter(
                    x => x.user_id === p.user_id && x.created_at < p.created_at && x.status === 'APPROVED'
                )
                if (usersPaymentsPriorToThisInRange.length > 0) {
                    isRepeat = true
                }
            }

            if (isRepeat) {
                row.repeatCount += 1
                row.repeatAmount += p.amount
            } else {
                row.newCount += 1
                row.newAmount += p.amount
            }

            row.totalCount += 1
            row.totalAmount += p.amount

            if (p.payment_method === 'BANK_TRANSFER' || p.payment_method === 'VIRTUAL_ACCOUNT') {
                row.bankAmount += p.amount
            } else {
                row.pgAmount += p.amount
            }
        }

        const results = Object.values(daysTracker).sort((a: any, b: any) => a.date.localeCompare(b.date))

        return NextResponse.json({ success: true, data: results })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
