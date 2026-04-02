import * as XLSX from 'xlsx';

function peek() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['job_output_data_20260323'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    console.log(`Checking Column D (Exposure Level) and Column C (Biz Name) for context:`);
    for (let i = 1; i < 15; i++) {
        console.log(`Row ${i}: [C] ${data[i][2]} | [D] ${data[i][3]}`);
    }
}

peek();
