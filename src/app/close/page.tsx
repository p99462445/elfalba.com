'use client';
import { useEffect } from 'react';
import Script from 'next/script';

export default function ClosePage() {
    return (
        <>
            <p>결제창을 닫는 중입니다...</p>
            <Script 
                src="https://stdpay.inicis.com/stdjs/INIStdPay_close.js" 
                strategy="afterInteractive"
            />
        </>
    );
}
