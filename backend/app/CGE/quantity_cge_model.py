import pandas as pd
import numpy as np

# 1. LOAD DATA & SETUP (Focusing on Delhi for this deep-dive)
original_sam = pd.read_csv("IFPRI_SAM_IND_2022-23_SAM.csv", index_col=0)
code_map = original_sam['Code'].dropna().to_dict()

sam = pd.read_csv("Delhi_SAM.csv", index_col=0)
sam = sam.rename(index=code_map)
sam = sam.apply(pd.to_numeric, errors='coerce').fillna(0)

activities = [col for col in sam.columns if col.startswith('a') and col != 'atax']
commodities = [col for col in sam.columns if col.startswith('c')]
factors = ['flab-n', 'flab-p', 'flab-s', 'flnd', 'fcap', 'ent']
households = [col for col in sam.columns if col.startswith('hhd')]

# 2. CALIBRATE BEHAVIORAL PARAMETERS
# A. Production Technology (Leontief)
io_matrix = sam.loc[commodities, activities].div(sam.loc['total', activities], axis=1).fillna(0)
va_matrix = sam.loc[factors, activities].div(sam.loc['total', activities], axis=1).fillna(0)

# B. Consumer Behavior (Alpha - percentage of income spent on each commodity)
total_hh_income = sam.loc['total', households].sum()
household_demand = sam.loc[commodities, households].sum(axis=1) # Total HH spending per commodity
alpha_comm = (household_demand / total_hh_income).fillna(0).values

# Base Factor Endowments (Total labor and capital in the economy)
factor_supply = sam.loc[factors, 'total'].values

# The Ripple Effect Matrix
I = np.eye(len(activities))
L_inv = np.linalg.inv(I - io_matrix.values)

# 3. BASELINE EQUILIBRIUM (Before Shock)
P_F_base = np.ones(len(factors))
P_C_base = (P_F_base @ va_matrix.values) @ L_inv

# Base Income and Demand
Income_base = np.sum(factor_supply * P_F_base)
Final_Demand_base = (alpha_comm * Income_base) / P_C_base

# Base Total Production Quantity (Q = Leontief Inverse * Final Demand)
Q_Output_base = L_inv @ Final_Demand_base


# 4. POLICY SHOCK: 50% Wage Hike for Unskilled Labor
print("\n[POLICY SHOCK]: Unskilled Labor Minimum Wage Increased by 50%!\n")
P_F_shock = np.ones(len(factors))
flab_n_index = factors.index('flab-n')
P_F_shock[flab_n_index] = 1.50  # Wage goes from 1.0 to 1.5

# Step A: Calculate New Prices
P_C_shock = (P_F_shock @ va_matrix.values) @ L_inv

# Step B: Calculate New Income (Laborers earn more, but prices are higher)
Income_shock = np.sum(factor_supply * P_F_shock)

# Step C: Calculate New Demand Quantities (Demand drops because prices rose faster than average income)
Final_Demand_shock = (alpha_comm * Income_shock) / P_C_shock

# Step D: Calculate New Factory Production Quantities
Q_Output_shock = L_inv @ Final_Demand_shock


# 5. ANALYSIS & RESULTS
results = pd.DataFrame({
    'Commodity_Code': commodities,
    'Base_Price': P_C_base,
    'New_Price': P_C_shock,
    'Base_Production_Qty': Q_Output_base,
    'New_Production_Qty': Q_Output_shock
})

# Calculate Price Inflation and Quantity Drop
results['Inflation_%'] = (results['New_Price'] - results['Base_Price']) * 100
results['Production_Drop_%'] = ((results['New_Production_Qty'] - results['Base_Production_Qty']) / results['Base_Production_Qty']) * 100

reverse_code_map = {v: k.replace('Commodities - ', '') for k, v in code_map.items() if str(v).startswith('c')}
results['Commodity_Name'] = results['Commodity_Code'].map(reverse_code_map)

print("=== REAL ECONOMIC IMPACT: PRICES VS PRODUCTION ===")
# Filter out sectors with zero production to avoid division by zero artifacts
valid_results = results[results['Base_Production_Qty'] > 1]

print("\nTop 5 Sectors that suffered the BIGGEST drop in Production (GDP Loss):")
top_losers = valid_results.sort_values(by='Production_Drop_%', ascending=True).head(5)
print(top_losers[['Commodity_Name', 'Inflation_%', 'Production_Drop_%']].to_string(index=False))

# Calculate Overall Economic GDP Drop
total_base_gdp = np.sum(Q_Output_base)
total_new_gdp = np.sum(Q_Output_shock)
gdp_drop = ((total_new_gdp - total_base_gdp) / total_base_gdp) * 100

print(f"\n[MACRO RESULT]: Overall Economy Production Dropped by {gdp_drop:.2f}%")