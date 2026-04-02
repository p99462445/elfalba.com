import * as XLSX from 'xlsx';

function analyze() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['job_output_data_20260323'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    // Check all columns in first 20 rows to see if any contain VVIP or VIP or something similar
    for (let j = 0; j < 20; j++) {
        const row = data[j];
        if (!row) continue;
        console.log(`Row ${j}: ${row.slice(0, 5).join(' | ')}`);
    }
}

analyze();
