'use client'
import React, { useEffect, useState, use } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Script from 'next/script'

export default function StandalonePaymentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const { id } = use(paramsPromise)
    const searchParams = useSearchParams()
    const productId = searchParams.get('productId')
    
    const [inicisParams, setInicisParams] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchParams = async () => {
            if (!productId) {
                setError('상품 정보가 없습니다.')
                setLoading(false)
                return
            }

            try {
                // 1. Fetch job and product info to generate params
                const [jobRes, prodRes] = await Promise.all([
                    fetch(`/api/jobs/${id}`),
                    fetch('/api/employer/products')
                ])

                if (!jobRes.ok || !prodRes.ok) throw new Error('정보를 불러오는데 실패했습니다.')
                
                const jobData = await jobRes.json()
                const products = await prodRes.json()
                const product = products.find((p: any) => p.id === productId)
                
                if (!product) throw new Error('선택된 상품을 찾을 수 없습니다.')

                const timestamp = new Date().getTime().toString()
                const oid = `INI_${jobData.job_no || 'X'}_${timestamp}`

                // 2. Signature 생성을 위해 서버 API 호출 (가장 안정적인 기존 데이터 구조 활용)
                const sigRes = await fetch('/api/payment/inicis/params', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oid, price: String(product.price), timestamp })
                })

                if (!sigRes.ok) throw new Error('인증 정보 생성 실패')
                const sigData = await sigRes.json()

                const userId = jobData.employer?.user_id;

                setInicisParams({
                    ...sigData,
                    oid,
                    timestamp,
                    price: String(product.price),
                    goodname: product.name,
                    buyername: jobData.employer?.user?.nickname || jobData.employer?.user?.name || jobData.business_name || '사용자',
                    buyertel: jobData.contact_value || jobData.employer?.phone || '1899-0930',
                    buyeremail: jobData.employer?.user?.email || 'customer@elfalba.com',
                    merchantData: `${id}:${productId}:${userId}:true` 
                })
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchParams()
    }, [id, productId])

    useEffect(() => {
        if (inicisParams && typeof (window as any).INIStdPay !== 'undefined') {
            try {
                // 부모 창에게 준비 완료 알림 (선택 사항)
                if (window.opener) {
                    window.opener.postMessage({ type: 'INICIS_POPUP_READY' }, '*');
                }
                
                // 결제창 호출
                (window as any).INIStdPay.pay('SendPayForm');
            } catch (err) {
                console.error('Inicis Pay Error:', err);
                setError('결제 모듈 호출 중 오류가 발생했습니다.');
            }
        }
    }, [inicisParams])

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
            <div>
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <button onClick={() => window.close()} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold">창 닫기</button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa]">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[15px] font-bold text-gray-600">안전한 결제창을 불러오는 중입니다...</p>
                <p className="text-[11px] text-gray-400">창을 닫지 마세요.</p>
            </div>

            <Script src="https://stdpay.inicis.com/stdjs/INIStdPay.js" strategy="afterInteractive" />
            
            <form id="SendPayForm" name="SendPayForm" method="POST" acceptCharset="UTF-8" style={{ display: 'none' }}>
                <input type="hidden" name="version" value="1.0" />
                <input type="hidden" name="mid" value={inicisParams?.mid || ''} />
                <input type="hidden" name="goodname" value={inicisParams?.goodname || ''} />
                <input type="hidden" name="oid" value={inicisParams?.oid || ''} />
                <input type="hidden" name="price" value={inicisParams?.price || ''} />
                <input type="hidden" name="currency" value="WON" />
                <input type="hidden" name="buyername" value={inicisParams?.buyername || ''} />
                <input type="hidden" name="buyertel" value={inicisParams?.buyertel || ''} />
                <input type="hidden" name="buyeremail" value={inicisParams?.buyeremail || ''} />
                <input type="hidden" name="timestamp" value={inicisParams?.timestamp || ''} />
                <input type="hidden" name="signature" value={inicisParams?.signature || ''} />
                <input type="hidden" name="returnUrl" value={typeof window !== 'undefined' ? `${window.location.origin}/api/payment/inicis/approve?isPopup=true` : ''} />
                <input type="hidden" name="mKey" value={inicisParams?.mKey || ''} />
                <input type="hidden" name="gopaymethod" value="Card" />
                <input type="hidden" name="offerPeriod" value="" />
                <input type="hidden" name="acceptmethod" value="HPP(1):below1000:va_receipt" />
                <input type="hidden" name="languageView" value="" />
                <input type="hidden" name="charset" value="" />
                <input type="hidden" name="payViewType" value="overlay" />
                <input type="hidden" name="closeUrl" value={typeof window !== 'undefined' ? `${window.location.origin}/close` : ''} />
                <input type="hidden" name="popupUrl" value="" />
                <input type="hidden" name="merchantData" value={inicisParams?.merchantData || ''} />
            </form>
        </div>
    )
}
