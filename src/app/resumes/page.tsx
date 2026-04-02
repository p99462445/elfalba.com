import React from 'react';
import ResumeClient from './ResumeClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '광고 안내 및 상품 | 엘프알바',
    description: '최적의 인재를 만나는 빠르고 확실한 방법. 엘프알바의 프리미엄 상단 노출 상품과 합리적인 비용 안내.',
};

export default function ResumePage() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-24">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">엘프알바 운영정책</h1>
            본 인재정보 이용 규칙은 엘프알바 운영 정책에 따릅니다.
            <ResumeClient />
        </main>
    );
}
