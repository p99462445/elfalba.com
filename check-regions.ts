import prisma from './src/lib/prisma';
import * as XLSX from 'xlsx';

async function main() {
    const all = await prisma.region.findMany({ orderBy: { id: 'asc' } });
    console.log('=== DB REGIONS (ALL) ===');
    all.forEach(r => console.log(`"${r.name}" -> "${r.slug}"`));

    const files = [
        { path: 'C:\\Users\\박근홍\\Desktop\\기존악녀DB.xlsx', sheet: '마감일남은공고목록' },
        { path: 'C:\\Users\\박근홍\\Desktop\\프리미엄광고.xlsx', sheet: 'job_output_data_20260323' }
    ];

    const allVals = new Set<string>();
    for (const f of files) {
        const book = XLSX.readFile(f.path);
        const data: any[][] = XLSX.utils.sheet_to_json(book.Sheets[f.sheet], { header: 1 });
        data.slice(1).forEach((r: any) => {
            if (!r[8]) return;
            r[8].toString().split('|').forEach((v: string) => {
                const trimmed = v.trim();
                if (trimmed) allVals.add(trimmed);
            });
        });
    }

    console.log('\n=== EXCEL I열 UNIQUE PARTS (splitting by |) ===');
    [...allVals].sort().forEach(v => console.log(`  "${v}"`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
