import pandas as pd
from bs4 import BeautifulSoup

def hybrid_clean(html):
    soup = BeautifulSoup(html, 'html.parser')
    
    # List of attributes to remove
    to_remove = ['style', 'color', 'face', 'size', 'bgcolor', 'background-color', 'class']
    
    for tag in soup.find_all(True):
        # 1. Strip unwanted attributes
        tag.attrs = {k: v for k, v in tag.attrs.items() if k.lower() not in to_remove}
        
        # 2. Unwrap 'font' tags but keep inner content
        if tag.name == 'font':
            tag.unwrap()
            
    return str(soup)

# Load first job
df = pd.read_excel(r'C:\Users\박근홍\Desktop\기존악녀DB.xlsx', sheet_name=0, nrows=1)
original_html = df['모집내용'].iloc[0]
cleaned_html = hybrid_clean(original_html)

print('=== ORIGINAL HTML (PARTIAL) ===')
print(original_html[:300])
print('\n=== HYBRID CLEANED HTML (PARTIAL) ===')
print(cleaned_html[:300])
