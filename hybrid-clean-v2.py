import pandas as pd
from bs4 import BeautifulSoup
import re

def hybrid_clean(html):
    if pd.isna(html): return ""
    soup = BeautifulSoup(str(html), 'html.parser')
    
    to_remove = ['style', 'color', 'face', 'size', 'bgcolor', 'background-color', 'class']
    
    for tag in soup.find_all(True):
        tag.attrs = {k: v for k, v in tag.attrs.items() if k.lower() not in to_remove}
        if tag.name == 'font':
            tag.unwrap()
            
    # Simple formatting fix: remove redundant whitespace
    res = str(soup)
    res = re.sub(r'\n\s*\n', '\n\n', res)
    return res

# Load Row 1 and Row 5
df = pd.read_excel(r'C:\Users\박근홍\Desktop\기존악녀DB.xlsx', sheet_name=0, nrows=10)

for idx in [0, 4]:
    original_html = df['모집내용'].iloc[idx]
    cleaned_html = hybrid_clean(original_html)
    
    print(f'=== SAMPLE {idx+1} (Row {idx+1}) ===')
    print('--- BEFORE (HTML snippet) ---')
    print(str(original_html)[:300] + '...')
    print('\n--- AFTER (CLEANED) ---')
    print(cleaned_html[:500] + '...')
    print('\n' + '='*30 + '\n')
