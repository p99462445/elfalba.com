'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Loader2 } from 'lucide-react';

export default function StandalonePaymentRequest({ params }: { params: { id: string } }) {
    const { id } = params;
    const searchParams = useSearchParams();
    const productId = searchParams.get('productId');
    const [inicisParams, setInicisParams] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            setError('상품 정보가 누락되었습니다.');
            return;
        }

        const initPayment = async () => {
            try {
                // 1. 세션 및 사용자 정보 가져오기 (클라이언트 측이므로 생략하고 API에서 처리하거나 필요한 데이터만 전송)
                const res = await fetch(`/api/payment/inicis/params`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobId: id,
                        productId: productId,
                        // 나머지 데이터는 API에서 현재 세션 기반으로 채움
                    })
                });

                if (!res.ok) throw new Error('결제 정보를 생성하지 못했습니다.');
                const data = await res.json();
                setInicisParams(data);
            } catch (err: any) {
                setError(err.message);
            }
        };

        initPayment();
    }, [id, productId]);

    // 이니시스 호출 연동
    useEffect(() => {
        if (inicisParams && (window as any).INIStdPay) {
            const timer = setTimeout(() => {
                (window as any).INIStdPay.pay('SendPayForm');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [inicisParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white">
                <div className="text-center">
                    <p className="text-red-500 font-black mb-4">{error}</p>
                    <button onClick={() => window.close()} className="px-6 py-2 bg-gray-100 rounded-xl font-bold">닫기</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CreditCard size={32} className="text-amber-500" />
                </div>
                <h1 className="text-xl font-black text-gray-900 mb-2">결제창을 연결하고 있습니다</h1>
                <p className="text-gray-500 font-medium mb-8">잠시만 기다려 주세요...</p>
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            </div>

            {/* Inicis SDK & Form */}
            <Script src="https://stdpay.inicis.com/stdjs/INIStdPay.js" strategy="afterInteractive" />
            
            {inicisParams && (
                <form id="SendPayForm" name="SendPayForm" method="POST" acceptCharset="UTF-8" style={{ display: 'none' }}>
                    <input type="hidden" name="version" value="1.0" />
                    <input type="hidden" name="mid" value={inicisParams.mid} />
                    <input type="hidden" name="goodname" value={inicisParams.goodname} />
                    <input type="hidden" name="oid" value={inicisParams.oid} />
                    <input type="hidden" name="price" value={inicisParams.price} />
                    <input type="hidden" name="currency" value="WON" />
                    <input type="hidden" name="buyername" value={inicisParams.buyername} />
                    <input type="hidden" name="buyertel" value={inicisParams.buyertel} />
                    <input type="hidden" name="buyeremail" value={inicisParams.buyeremail} />
                    <input type="hidden" name="timestamp" value={inicisParams.timestamp} />
                    <input type="hidden" name="signature" value={inicisParams.signature} />
                    <input type="hidden" name="returnUrl" value={`${window.location.origin}/api/payment/inicis/approve?isPopup=true`} />
                    <input type="hidden" name="mKey" value={inicisParams.mKey} />
                    <input type="hidden" name="gopaymethod" value="Card" />
                    <input type="hidden" name="offerPeriod" value="" />
                    <input type="hidden" name="acceptmethod" value="HPP(1):below1000:va_receipt" />
                    <input type="hidden" name="languageView" value="" />
                    <input type="hidden" name="charset" value="" />
                    <input type="hidden" name="payViewType" value="overlay" />
                    <input type="hidden" name="closeUrl" value={`${window.location.origin}/close`} />
                    <input type="hidden" name="popupUrl" value="" />
                    <input type="hidden" name="merchantData" value={inicisParams.merchantData || ''} />
                </form>
            )}
        </div>
    );
}
