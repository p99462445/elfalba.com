'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import JobCard from './JobCard'
import JobCardSkeleton from './JobCardSkeleton'

interface InfiniteJobListProps {
    initialJobs: any[]
    siteName: string
    regionSlug?: string
    categorySlug?: string
}

export default function InfiniteJobList({
    initialJobs,
    siteName,
    regionSlug = 'all',
    categorySlug = 'all'
}: InfiniteJobListProps) {
    const [jobs, setJobs] = useState(initialJobs)
    const [page, setPage] = useState(2) // Initial jobs are page 1
    const [hasMore, setHasMore] = useState(initialJobs.length >= 20)
    const [isFetching, setIsFetching] = useState(false)
    const observer = useRef<IntersectionObserver | null>(null)

    const lastJobElementRef = useCallback((node: HTMLDivElement) => {
        if (isFetching) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMoreJobs()
            }
        })

        if (node) observer.current.observe(node)
    }, [isFetching, hasMore])

    const fetchMoreJobs = async () => {
        if (isFetching || !hasMore) return

        setIsFetching(true)
        try {
            const res = await fetch(`/api/jobs?page=${page}&region=${regionSlug}&category=${categorySlug}`)
            const data = await res.json()

            if (data.jobs && data.jobs.length > 0) {
                setJobs(prev => {
                    // Filter duplicates just in case
                    const newJobs = data.jobs.filter((nj: any) => !prev.some(pj => pj.id === nj.id))
                    return [...prev, ...newJobs]
                })
                setPage(prev => prev + 1)

                if (data.jobs.length < (data.limit || 30)) {
                    setHasMore(false)
                }
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Failed to fetch more jobs:", error)
        } finally {
            setIsFetching(false)
        }
    }

    return (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
            {jobs.map((job, index) => {
                if (jobs.length === index + 1) {
                    return (
                        <div ref={lastJobElementRef} key={job.id}>
                            <JobCard job={job} theme="general" priority={index < 4} />
                        </div>
                    )
                } else {
                    return <JobCard key={job.id} job={job} theme="general" priority={index < 4} />
                }
            })}

            {isFetching && (
                <div className="p-4 space-y-4">
                    <JobCardSkeleton />
                    <JobCardSkeleton />
                </div>
            )}

            {/* 
              마지막 공고 안내 메시지 삭제 요청 (by USER) - 2026-03-17 v2
            */}
        </div>
    )
}
