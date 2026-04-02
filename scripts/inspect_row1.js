const fs = require('fs');

function parseLine(line) {
    if (!line) return [];
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(s => s.replace(/^"|"$/g, ''));
}

const lines = fs.readFileSync('test_users_final_fixed.csv', 'utf8').split('\n');
const headers = parseLine(lines[0]);

for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const nonZeroExtra = [];
    for (let j = 0; j < cols.length; j++) {
        if (cols[j] && cols[j] !== '0' && !headers[j].match(/No|그룹|아이디|이름|닉네임|핸드폰|이-메일|상호|사업자번호|최종방문일|로그인수|가입/)) {
            // Just show us something interesting
            // nonZeroExtra.push(`${headers[j]}: ${cols[j]}`);
        }
    }
}
// Let's just look at row 1 very carefully.
const row1 = parseLine(lines[1]);
row1.forEach((val, idx) => console.log(`${idx} (${headers[idx]}): ${val}`));
