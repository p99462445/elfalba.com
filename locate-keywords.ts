import * as XLSX from 'xlsx';

function analyze() {
    const jobsPath = 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx';
    const jobsBook = XLSX.readFile(jobsPath);
    const jobsSheet = jobsBook.Sheets['job_output_data_20260323'];
    const data: any[][] = XLSX.utils.sheet_to_json(jobsSheet, { header: 1 });

    const headers = data[0];
    console.log(`Headers:`, headers);

    // Find where VVIP or 스페셜 is
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
            const val = String(row[j]);
            if (val.includes('VVIP') || val.includes('스페셜') || val.includes('VIP')) {
                console.log(`Found value '${val}' at Row ${i}, Col ${j} (${String.fromCharCode(65 + j)})`);
            }
        }
    }
}

analyze();
