import pandas as pd

india_sam = pd.read_csv("IFPRI_SAM_IND_2022-23_SAM.csv", index_col=0)

india_sam = india_sam.apply(pd.to_numeric, errors='coerce')

india_sam = india_sam.fillna(0)

gdp_data = {
    "Andhra Pradesh":1309463.97,
    "Arunachal Pradesh":35711.5,
    "Assam":484984.93,
    "Bihar":763164.72,
    "Chhattisgarh":458891.32,
    "Delhi":999749.39,
    "Goa":93672.38,
    "Gujarat":2203418.97,
    "Haryana":974732.33,
    "Himachal Pradesh":192026.13,
    "Jammu & Kashmir":209815.52,
    "Jharkhand":414307.68,
    "Karnataka":2319696.23,
    "Kerala":1038734.06,
    "Madhya Pradesh":1221812.5,
    "Maharashtra":3641542.9,
    "Manipur":38524.31,
    "Meghalaya":46833.8,
    "Mizoram":30184.18,
    "Nagaland":35628.63,
    "Odisha":715262.45,
    "Punjab":692519.25,
    "Rajasthan":1356479.87,
    "Sikkim":42677.45,
    "Tamil Nadu":2372469.27,
    "Telangana":1310720.67,
    "Tripura":70633.44,
    "Uttar Pradesh":2295763.18,
    "Uttarakhand":292669.94,
    "West Bengal":1515564.5
}

total_gdp = sum(gdp_data.values())
state_shares = {state: val / total_gdp for state, val in gdp_data.items()}

print("Data types after conversion:")
print(india_sam.dtypes.head())

for state, share in state_shares.items():
    state_sam = india_sam * share
    
    filename = state.replace(" ", "_") + "_SAM.csv"
    state_sam.to_csv(filename)

print("\nAll state SAMs generated successfully!")