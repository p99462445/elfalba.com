'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentSuccessPage() {
    const [isPopup, setIsPopup] = React.useState(false);

    useEffect(() => {
        // 팝업인 경우 부모 창을 새로고침하고 창을 닫음
        const searchParams = new URLSearchParams(window.location.search);
        const popupFlag = searchParams.get('isPopup') === 'true';
        setIsPopup(popupFlag);

        if (popupFlag) {
            // 부모 창이 있으면 새로고침 혹은 성공 페이지로 이동
            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.location.href = '/employer/payments?success=true';
                } catch (e) {
                    console.error('부모 창 리다이렉트 실패:', e);
                }
            }
            
            // 2초 뒤 자동 종료 안내 혹은 즉시 종료
            const timer = setTimeout(() => {
                window.close();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center p-6 text-center transition-colors">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">결제가 완료되었습니다!</h1>
            <p className="text-gray-500 dark:text-gray-400 font-bold mb-8">
                {isPopup ? '창이 자동으로 닫히지 않으면 직접 닫아주세요.' : '이제 광고가 정상적으로 연장/활성화되었습니다.'}
            </p>
            {isPopup ? (
                <button 
                    onClick={() => window.close()}
                    className="px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl font-black active:scale-95 transition"
                >
                    창 닫기
                </button>
            ) : (
                <button 
                    onClick={() => window.location.href = '/employer/payments'}
                    className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black active:scale-95 transition shadow-lg shadow-amber-200 dark:shadow-none"
                >
                    결제 내역으로 돌아가기
                </button>
            )}
        </div>
    );
}
