'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

export default function SmsAdminClient({ 
  initialTab, 
  logs, 
  logTotal, 
  logPage, 
  logTotalPages,
  siteConfig 
}: any) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  
  // DB 값이 비어있을 경우를 대비한 기본값 처리
  const [config, setConfig] = useState({
    ...siteConfig,
    sms_expiry_2d_text: siteConfig.sms_expiry_2d_text || "♥엘프알바♥대표님의 광고가 2일 남으셨어요^.^연장 신청바랍니다 elfalba.com",
    sms_expiry_1d_text: siteConfig.sms_expiry_1d_text || "♥엘프알바♥대표님의 광고가 내일 마감되세요^.^연장 신청바랍니다 elfalba.com",
    sms_expired_1d_text: siteConfig.sms_expired_1d_text || "♥엘프알바♥대표님의 광고가 마감되었어요^.^연장 신청바랍니다 elfalba.com",
    sms_payment_text: siteConfig.sms_payment_text || "[엘프알바] {금액}원 입금 부탁드립니다. {은행} {계좌} 예금주:{예금주} 문의:1899-0930"
  });
  
  // 개별발송용 상태
  const [manualPhone, setManualPhone] = useState('');
  const [manualMsg, setManualMsg] = useState('');

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/site-config/sms', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      if (res.ok) alert('설정이 저장되었습니다.');
      else alert('저장 중 오류가 발생했습니다.');
    } catch (err) {
      alert('통신 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendManual = async () => {
    if (!manualPhone || !manualMsg) return alert('번호와 내용을 입력해주세요.');
    setIsSaving(true);
    try {
      const res = await fetch('/api/common/notify-sms', { // 기존 API 활용 또는 신규
        method: 'POST',
        body: JSON.stringify({ to: manualPhone, message: manualMsg, type: 'MANUAL' }),
      });
      if (res.ok) {
        alert('발송 요청이 접수되었습니다.');
        setManualMsg('');
      } else alert('발송 중 오류가 발생했습니다.');
    } catch (err) {
        alert('통신 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          발송 내역
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'config' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          SMS 환경설정
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          SMS 개별발송
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">발송일시</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">수신번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">메시지</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{log.type}</span></td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{log.to}</td>
                    <td className="px-4 py-3 truncate max-w-xs text-gray-600 dark:text-gray-300">{log.message}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-center gap-1">
             {Array.from({ length: logTotalPages }).map((_, i) => (
               <Link 
                 key={i} 
                 href={`?tab=logs&page=${i+1}`} 
                 className={`px-3 py-1 border rounded transition-colors ${logPage === i+1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
               >
                 {i+1}
               </Link>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800/30">
            <strong>가이드:</strong> 메시지 내용에 <code>{'{업소명}'}</code>, <code>{'{마감일}'}</code>, <code>{'{금액}'}</code> 등을 포함하면 실제 데이터로 치환되어 발송됩니다.
          </div>
          
          <div className="grid gap-4">
            <SmsConfigRow 
              title="마감 2일 전 알림" 
              text={config.sms_expiry_2d_text} 
              enabled={config.sms_expiry_2d_enabled}
              onTextChange={(val: string) => setConfig({...config, sms_expiry_2d_text: val})}
              onToggle={() => setConfig({...config, sms_expiry_2d_enabled: !config.sms_expiry_2d_enabled})}
            />
            <SmsConfigRow 
              title="마감 1일 전 알림" 
              text={config.sms_expiry_1d_text} 
              enabled={config.sms_expiry_1d_enabled}
              onTextChange={(val: string) => setConfig({...config, sms_expiry_1d_text: val})}
              onToggle={() => setConfig({...config, sms_expiry_1d_enabled: !config.sms_expiry_1d_enabled})}
            />
            <SmsConfigRow 
              title="마감 1일 후 안내" 
              text={config.sms_expired_1d_text} 
              enabled={config.sms_expired_1d_enabled}
              onTextChange={(val: string) => setConfig({...config, sms_expired_1d_text: val})}
              onToggle={() => setConfig({...config, sms_expired_1d_enabled: !config.sms_expired_1d_enabled})}
            />
            <SmsConfigRow 
              title="결제 계좌 안내" 
              text={config.sms_payment_text} 
              enabled={config.sms_payment_enabled}
              onTextChange={(val: string) => setConfig({...config, sms_payment_text: val})}
              onToggle={() => setConfig({...config, sms_payment_enabled: !config.sms_payment_enabled})}
            />
          </div>

          <div className="pt-6 border-t dark:border-gray-700 flex justify-end">
             <button 
               onClick={handleSaveConfig}
               disabled={isSaving}
               className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all hover:scale-105"
             >
               {isSaving ? '저장 중...' : '설정 저장하기'}
             </button>
          </div>
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="max-w-2xl bg-gray-50 dark:bg-gray-800/40 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
           <h3 className="text-lg font-bold mb-4 dark:text-gray-100">SMS 개별 발송</h3>
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">수신 번호</label>
               <input 
                 type="text" 
                 placeholder="01012345678"
                 value={manualPhone}
                 onChange={(e) => setManualPhone(e.target.value)}
                 className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">메시지 내용</label>
               <textarea 
                 rows={6}
                 value={manualMsg}
                 onChange={(e) => setManualMsg(e.target.value)}
                 placeholder="보낼 내용을 입력하세요..."
                 className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
               />
               <div className="text-right text-xs text-gray-400 mt-1">{manualMsg.length}자 입력됨</div>
             </div>
             <button 
               onClick={handleSendManual}
               disabled={isSaving}
               className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-all"
             >
               {isSaving ? '발송 요청 중...' : '즉시 발송하기'}
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

function SmsConfigRow({ title, text, enabled, onTextChange, onToggle }: any) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/50 shadow-sm transition-colors">
      <div className="md:w-48 pt-2">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={enabled} onChange={onToggle} className="w-5 h-5 accent-blue-600" />
          {title}
        </label>
        <p className="text-xs text-gray-400 mt-1">{enabled ? '자동 발송 사용 중' : '사용 안 함'}</p>
      </div>
      <div className="flex-1">
        <textarea 
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={!enabled}
          rows={3}
          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 transition-all"
        />
      </div>
    </div>
  );
}
