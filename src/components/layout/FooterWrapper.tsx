import prisma from '@/lib/prisma';
import Footer from './Footer';

export const dynamic = 'force-dynamic';

/**
 * 서버 사이드에서 DB 정보를 가져와 푸터에 전달하는 래퍼 컴포넌트
 */
export default async function FooterWrapper() {
    let siteConfig: any = {
        footer_company_name: "CMCOMPANY",
        footer_address: "서울특별시 송파구 올림픽로 212 , 에이동 1343호",
        footer_business_num: "623-86-00786",
        footer_report_num: "2022-서울송파-2449",
        footer_ceo_name: "박근홍",
        footer_fax: "0504-175-2445",
        footer_job_info_num: "J1515020170005"
    };

    try {
        const config = await prisma.siteConfig.findFirst();
        if (config) {
            siteConfig = config;
        }
    } catch (error) {
        console.error('FooterWrapper: DB fetch error, using defaults', error);
    }

    return <Footer config={siteConfig} />;
}
