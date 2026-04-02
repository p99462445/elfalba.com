import * as XLSX from 'xlsx';

function findSpecial() {
    const jobsPath1 = 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx';
    const jobsPath2 = 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx';

    const analyze = (path: string, sheet: string) => {
        const book = XLSX.readFile(path);
        const data: any[][] = XLSX.utils.sheet_to_json(book.Sheets[sheet], { header: 1 });
        const allText = JSON.stringify(data);
        if (allText.includes('스페셜')) console.log(`${path}: has '스페셜'`);
        if (allText.includes('VVIP')) console.log(`${path}: has 'VVIP'`);
    };

    analyze(jobsPath1, 'job_output_data_20260323');
    analyze(jobsPath2, '마감일남은공고목록');
}

findSpecial();
