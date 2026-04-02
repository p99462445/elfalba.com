export default function PolicyPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 p-6 md:p-12 font-sans pt-20">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-black mb-8 text-amber-500">성매매 제한 규정</h1>

                <div className="prose prose-gray max-w-none text-[15px] leading-[1.8]">
                    <p className="font-bold text-gray-900 mb-6">
                        엘프알바는 구직자를 보호하고 올바른 채용문화를 만들기 위해 제한규정을 실시하고 있으며<br />
                        이용자의 신고가 들어오면 바로 확인해서 조치하고 있어요.
                    </p>
                    <p className="font-bold text-red-500 mb-10">
                        성매매와 관련된 광고 또는 글, 댓글, 채팅 등을 입력할 경우에는 사전 동의 없이 수정, 삭제,<br />
                        이용제한 조치가 될 수 있어요.
                    </p>

                    <h2 className="text-xl font-black text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-100">제한규정</h2>
                    <p className="mb-6">
                        (1) 「성매매알선 등 행위의 처벌에 관한 법률」 제4조에 따른 금지행위가 행하여지는 업소에 대한 구인광고를 금지하고 있어요.
                    </p>

                    <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">제 4조</h3>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                            <li>성매매</li>
                            <li>성매매알선 등 행위</li>
                            <li>성매매 목적의 인신매매</li>
                            <li>성을 파는 행위를 하게 할 목적으로 다른 사람을 고용·모집하거나 성매매가 행하여진다는 사실을 알고 직업을 소개·알선하는 행위</li>
                            <li>제1호·제2호 및 제4호의 행위 및 그 행위가 행하여지는 업소에 대한 광고행위</li>
                        </ol>
                    </div>

                    <p className="mb-6">
                        (2) 「성매매알선 등 행위의 처벌에 관한 법률」 제19조, 제 20조에 따라 발생하는 법적인 책임은 작성자에게 있어요.
                    </p>

                    <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">제 19조</h3>
                        <p className="font-bold text-gray-800 mb-2">① 다음 각 호의 어느 하나에 해당하는 사람은 3년 이하의 징역 또는 3천만원 이하의 벌금에 처한다.</p>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-600 mb-6">
                            <li>성매매알선 등 행위를 한 사람</li>
                            <li>성을 파는 행위를 할 사람을 모집한 사람</li>
                            <li>성을 파는 행위를 하도록 직업을 소개·알선한 사람</li>
                        </ol>

                        <p className="font-bold text-gray-800 mb-2">② 다음 각 호의 어느 하나에 해당하는 사람은 7년 이하의 징역 또는 7천만원 이하의 벌금에 처한다.</p>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                            <li>영업으로 성매매알선 등 행위를 한 사람</li>
                            <li>성을 파는 행위를 할 사람을 모집하고 그 대가를 지급받은 사람</li>
                            <li>성을 파는 행위를 하도록 직업을 소개·알선하고 그 대가를 지급받은 사람</li>
                        </ol>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">제 20조</h3>
                        <p className="font-bold text-gray-800 mb-2">① 다음 각 호의 어느 하나에 해당하는 사람은 3년 이하의 징역 또는 3천만원 이하의 벌금에 처한다.</p>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-600 mb-6">
                            <li>성을 파는 행위 또는 「형법」 제245조에 따른 음란행위 등을 하도록 직업을 소개·알선할 목적으로 광고(각종 간행물, 유인물, 전화, 인터넷, 그 밖의 매체를 통한 행위를 포함한다. 이하 같다)를 한 사람</li>
                            <li>성매매 또는 성매매알선 등 행위가 행하여지는 업소에 대한 광고를 한 사람</li>
                            <li>성을 사는 행위를 권유하거나 유인하는 광고를 한 사람</li>
                        </ol>

                        <p className="mb-4 text-gray-800 leading-relaxed font-medium">
                            ② 영업으로 제1항에 따른 광고물을 제작·공급하거나 광고를 게재한 사람은 2년 이하의 징역 또는 1천만원 이하의 벌금에 처한다.
                        </p>
                        <p className="text-gray-800 leading-relaxed font-medium">
                            ③ 영업으로 제1항에 따른 광고물이나 광고가 게재된 출판물을 배포한 사람은 1년 이하의 징역 또는 500만원 이하의 벌금에 처한다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
