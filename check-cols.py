import pandas as pd
df = pd.read_excel(r"C:\Users\박근홍\Desktop\최종공고.xlsx", nrows=5)
print(df.columns.tolist())
