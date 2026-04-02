import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col items-center justify-center p-4">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">404</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold text-center">요청하신 페이지를 찾을 수 없습니다.</p>
            <Link
                href="/"
                className="px-8 py-3 bg-amber-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-amber-100 dark:shadow-none hover:scale-105 transition"
            >
                홈으로 돌아가기
            </Link>
        </div>
    )
}
