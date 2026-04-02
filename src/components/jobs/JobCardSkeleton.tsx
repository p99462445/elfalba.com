import React from 'react'

export default function JobCardSkeleton() {
    return (
        <div className="block border-b border-gray-100 dark:border-dark-border last:border-0 p-2.5 bg-white dark:bg-dark-card animate-pulse">
            <div className="flex gap-2.5 items-center">
                {/* Compact Logo Skeleton */}
                <div className="w-[52px] h-[52px] rounded-xl bg-gray-100 dark:bg-dark-bg flex-shrink-0" />

                {/* Content area Skeleton */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-100 dark:bg-dark-bg rounded w-2/3" />
                        <div className="h-3 bg-gray-50 dark:bg-dark-bg rounded w-10" />
                    </div>

                    <div className="h-3 bg-gray-50 dark:bg-dark-bg rounded w-1/3" />

                    <div className="flex items-center justify-between mt-1">
                        <div className="h-4 bg-gray-100 dark:bg-dark-bg rounded w-20" />
                        <div className="h-3 bg-gray-50 dark:bg-dark-bg rounded w-16" />
                    </div>
                </div>
            </div>
        </div>
    )
}
