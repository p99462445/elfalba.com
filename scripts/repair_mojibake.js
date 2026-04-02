const fs = require('fs');

// Mojibake Repair Function
// The file is UTF-8 but contains characters from reading UTF-8 as CP949.
// To fix: String -> Bytes (Latin1) -> Interpret as UTF-8
function repairMojibake(str) {
    if (!str) return '';
    try {
        const buf = Buffer.from(str, 'latin1');
        const restored = buf.toString('utf8');
        // If it still looks like mojibake or is empty, return original
        return restored || str;
    } catch (e) {
        return str;
    }
}

async function processFile() {
    const inputFile = 'Member_original.xls';
    const outputFile = 'test_users_300_fixed.csv';

    console.log('Starting Mojibake Repair & Extraction...');

    // Read a chunk to get rows
    const buffer = Buffer.alloc(15 * 1024 * 1024); // 15MB enough for 300 rows
    const fd = fs.openSync(inputFile, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 15 * 1024 * 1024, 0);
    fs.closeSync(fd);

    const content = buffer.slice(0, bytesRead).toString('utf8');
    const rows = content.split(/<tr/i);

    // UTF-8 BOM for Excel compatibility
    const csvStream = fs.createWriteStream(outputFile);
    csvStream.write('\ufeff');

    let count = 0;
    const max = 300;
    let headerSent = false;

    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i];
        const cells = [];
        const tdRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;
        let match;
        while ((match = tdRegex.exec(rowData)) !== null) {
            let cell = match[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            cell = cell.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');

            // Repair the broken Korean
            cell = repairMojibake(cell);
            cells.push(cell);
        }

        if (cells.length > 0) {
            const csvLine = cells.map(cell => {
                let escaped = cell.replace(/"/g, '""');
                if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
                    return `"${escaped}"`;
                }
                return escaped;
            }).join(',');

            if (!headerSent) {
                csvStream.write(csvLine + '\n');
                headerSent = true;
                console.log('Restored Header:', csvLine);
            } else if (count < max) {
                csvStream.write(csvLine + '\n');
                count++;
            } else {
                break;
            }
        }
    }

    csvStream.end();
    console.log(`\n✅ Success! Saved ${count} RESTORED rows to ${outputFile}`);
}

processFile().catch(console.error);
