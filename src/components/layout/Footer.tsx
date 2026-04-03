'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer({ config }: { config?: any }) {
    const pathname = usePathname()
    
    if (pathname.includes('/messages')) {
        return null;
    }
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('isPopup') === 'true') {
        return null;
    }

    const siteName = config?.site_name || "엘프알바";
    const companyName = config?.footer_company_name || "CMCOMPANY";
    const address = config?.footer_address || "서울특별시 송파구 올림픽로 212 , 에이동 1343호";
    const businessNum = config?.footer_business_num || "623-86-00786";
    const reportNum = config?.footer_report_num || "2022-서울송파-2449";
    const ceoName = config?.footer_ceo_name || "박근홍";
    const fax = config?.footer_fax || "0504-175-2445";
    const jobInfoNum = config?.footer_job_info_num || "J1515020170005";

    return (
        <footer className="bg-white dark:bg-dark-bg pb-20 pt-0 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-center flex-wrap gap-2 text-[11px] text-gray-400 dark:text-gray-500 mb-6">
                    <Link href="/privacy" prefetch={true} className="px-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">개인정보보호정책</Link>
                    <span className="text-gray-200">|</span>
                    <Link href="/terms" prefetch={true} className="px-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">이용약관</Link>
                    <span className="text-gray-200">|</span>
                    <Link href="/refund" prefetch={true} className="px-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">환불정책</Link>
                    <span className="text-gray-200">|</span>
                    <Link href="/방송모델-고객센터" prefetch={true} className="px-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">고객센터</Link>
                    <span className="text-gray-200">|</span>
                    <Link href="/unpaid-employers" prefetch={true} className="px-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">체불사업자명단</Link>
                    <span className="text-gray-200">|</span>
                    <a href="https://www.minimumwage.go.kr/main.do" target="_blank" rel="noopener noreferrer" className="px-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">최저임금위원회</a>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="text-[10px] text-gray-400 leading-relaxed uppercase text-center space-y-1">
                        <p>{address}</p>
                        <p>
                            팩스 : {fax} | 사업자 등록번호 : {businessNum} | 통신판매업신고 : {reportNum} | 대표자 : {ceoName}
                        </p>
                        <p>
                            직업정보제공사업신고확인증 : J1515020170005 | COPYRIGHT(c) 2011 엘프알바. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
