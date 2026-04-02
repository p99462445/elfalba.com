import pandas as pd
import json

df = pd.read_excel(r"C:\Users\박근홍\Desktop\최종공고.xlsx")
# Filter for target ID
target_df = df[df['회원ID'] == 'kkhhss2501']

jobs = []
for idx, row in target_df.iterrows():
    jobs.append({
        "title": str(row.get('제목', '제목없음')),
        "company_name": str(row.get('공고상호명', '공고상호명없음')),
        "address": str(row.get('주소', '')),
        "content": str(row.get('모집내용', '')),
        "phone": str(row.get('담당자 HP', '')),
        "created_at": str(row.get('등록일', ''))
        # Add other fields as needed
    })

print(json.dumps(jobs, ensure_ascii=False))
