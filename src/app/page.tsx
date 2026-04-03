import React, { Suspense } from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import HomeNoticesSection from '@/components/home/HomeNoticesSection'
import JobCard from '@/components/jobs/JobCard'
import JobCardSkeleton from '@/components/jobs/JobCardSkeleton'
import InfiniteJobList from '@/components/jobs/InfiniteJobList'
import { MOCK_JOBS, MOCK_NOTICES } from '@/lib/mockData'

export const revalidate = 60

// 1. Premium (VVIP) Section Component
async function VvipJobsSection() {
  const jobs = MOCK_JOBS.slice(0, 4)
  if (jobs.length === 0) return null

  return (
    <section className="px-4 pt-1 pb-2 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">👑</span>
          <h2 className="text-xl font-bold text-gray-900">프리미엄 채용정보</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {jobs.map((job, idx) => <JobCard key={job.id} job={job} theme="premium" priority={idx === 0} />)}
        </div>
      </div>
    </section>
  )
}

// 2. Featured (VIP) Section Component
async function VipJobsSection() {
  const jobs = MOCK_JOBS.slice(4, 10)
  if (jobs.length === 0) return null

  return (
    <section className="px-4 pt-2 pb-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl text-amber-500">⭐</span>
          <h2 className="text-xl font-bold">추천 채용정보</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {jobs.map(job => <JobCard key={job.id} job={job} theme="featured" />)}
        </div>
      </div>
    </section>
  )
}

// 3. General (LIST) Section Component
async function GeneralJobsSection({ siteName }: { siteName: string }) {
  const jobs = MOCK_JOBS
  if (jobs.length === 0) return null

  return (
    <section className="px-4 pt-2 pb-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl text-gray-400">📑</span>
          <h2 className="text-xl font-bold text-gray-700">{siteName} 채용정보</h2>
        </div>
        <InfiniteJobList
          initialJobs={JSON.parse(JSON.stringify(jobs))}
          siteName={siteName}
          regionSlug="all"
          categorySlug="all"
        />
      </div>
    </section>
  )
}

// 4. Notice Section Wrapper
async function NoticesSection() {
  return <HomeNoticesSection notices={MOCK_NOTICES.slice(0, 5)} />
}

// 5. Official Partner Section Component
async function OfficialPartnerSection() {
  const jobs = MOCK_JOBS.slice(0, 4)
  if (jobs.length === 0) return null

  return (
    <section className="px-4 pt-2 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-amber-500 font-black text-2xl italic h-[44px] flex items-center">엘프알바</div>
          <h2 className="text-[19px] font-black tracking-tight text-gray-900 leading-none pb-0.5">
              공식 파트너
          </h2>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 overflow-hidden ring-1 ring-amber-500/10">
          {jobs.map((job, idx) => <JobCard key={job.id} job={job} theme="premium" priority={idx < 2} />)}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const config = {
    site_name: '엘프알바',
    contact_phone: '1899-0930',
    bank_name: '국민은행',
    bank_account: '219401-04-263185',
    bank_owner: '(주)세컨즈나인',
  }

  return (
    <div className="bg-white dark:bg-dark-bg">
      {/* 1. Header is already in layout.tsx, but we can have page-specific top content here if any */}

      {/* 2. Content Sections with Streaming (Suspense) */}
      <Suspense fallback={
        <div className="px-4 py-8 max-w-2xl mx-auto animate-pulse">
          <div className="flex space-x-2 mb-4"><div className="h-6 bg-gray-100 rounded w-8" /><div className="h-6 bg-gray-100 rounded w-48" /></div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-50 dark:border-dark-border h-[200px]" />
        </div>
      }>
        <OfficialPartnerSection />
      </Suspense>

      <Suspense fallback={
        <div className="px-4 py-8 max-w-2xl mx-auto animate-pulse">
          <div className="flex space-x-2 mb-4"><div className="h-6 bg-gray-100 rounded w-8" /><div className="h-6 bg-gray-100 rounded w-48" /></div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-50 dark:border-dark-border h-[300px]" />
        </div>
      }>
        <VvipJobsSection />
      </Suspense>

      <Suspense fallback={<div className="px-4 py-8 max-w-2xl mx-auto"><JobCardSkeleton /></div>}>
        <VipJobsSection />
      </Suspense>

      <Suspense fallback={<div className="px-4 py-8 max-w-2xl mx-auto"><JobCardSkeleton /></div>}>
        <GeneralJobsSection siteName={config.site_name} />
      </Suspense>

      <Suspense fallback={null}>
        <NoticesSection />
      </Suspense>

      <section className="px-0 pt-15 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center py-0">
            <div className="text-center">
              <h4 className="text-gray-900 font-bold text-xl mb-3">고객센터</h4>
              <a href={`tel:${config.contact_phone}`} className="block text-amber-500 text-2xl font-black leading-tight hover:text-amber-600 transition">
                {config.contact_phone}
              </a>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed font-bold">상담가능시간<br />평일 11:00 ~ 20:00<br />(주말, 공휴일 휴무)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Copy Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', () => {
              const buttons = document.querySelectorAll('.copy-btn');
              buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                  const text = btn.getAttribute('data-clipboard-text');
                  if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                      alert('계좌번호가 복사되었습니다: ' + text);
                    }).catch(err => {
                      console.error('Copy failed', err);
                    });
                  }
                });
              });
            });
          `
        }}
      />
    </div>
  )
}
