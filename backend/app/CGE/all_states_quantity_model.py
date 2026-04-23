import pandas as pd
import numpy as np
import glob

original_sam = pd.read_csv("IFPRI_SAM_IND_2022-23_SAM.csv", index_col=0)
code_map = original_sam['Code'].dropna().to_dict()

state_files = glob.glob("*_SAM.csv")
state_files = [f for f in state_files if "IFPRI" not in f and "Macro" not in f]

results_list = []

for file in state_files:
    state_name = file.replace("_SAM.csv", "")
    
    sam = pd.read_csv(file, index_col=0)
    if 'ccons' not in sam.index:
        sam = sam.rename(index=code_map)
    sam = sam.apply(pd.to_numeric, errors='coerce').fillna(0)
    
    activities = [col for col in sam.columns if col.startswith('a') and col != 'atax']
    commodities = [col for col in sam.columns if col.startswith('c')]
    factors = ['flab-n', 'flab-p', 'flab-s', 'flnd', 'fcap', 'ent']
    households = [col for col in sam.columns if col.startswith('hhd')]
    
    io_matrix = sam.loc[commodities, activities].div(sam.loc['total', activities], axis=1).fillna(0)
    va_matrix = sam.loc[factors, activities].div(sam.loc['total', activities], axis=1).fillna(0)
    
    total_hh_income = sam.loc['total', households].sum()
    household_demand = sam.loc[commodities, households].sum(axis=1)
    alpha_comm = (household_demand / total_hh_income).fillna(0).values
    factor_supply = sam.loc[factors, 'total'].values
    
    I = np.eye(len(activities))
    L_inv = np.linalg.inv(I - io_matrix.values)
    
    P_F_base = np.ones(len(factors))
    P_C_base = (P_F_base @ va_matrix.values) @ L_inv
    Income_base = np.sum(factor_supply * P_F_base)
    Final_Demand_base = (alpha_comm * Income_base) / P_C_base
    Q_Output_base = L_inv @ Final_Demand_base
    
    P_F_shock = np.ones(len(factors))
    flab_n_index = factors.index('flab-n')
    P_F_shock[flab_n_index] = 1.50
    
    P_C_shock = (P_F_shock @ va_matrix.values) @ L_inv
    Income_shock = np.sum(factor_supply * P_F_shock)
    Final_Demand_shock = (alpha_comm * Income_shock) / P_C_shock
    Q_Output_shock = L_inv @ Final_Demand_shock
    
    total_base_gdp = np.sum(Q_Output_base)
    total_new_gdp = np.sum(Q_Output_shock)
    gdp_drop_pct = ((total_new_gdp - total_base_gdp) / total_base_gdp) * 100
    absolute_gdp_loss = total_base_gdp - total_new_gdp
    
    results_list.append({
        'State': state_name,
        'Base_GDP_Value': round(total_base_gdp, 2),
        'New_GDP_Value': round(total_new_gdp, 2),
        'GDP_Drop_%': round(gdp_drop_pct, 4),
        'Total_Economic_Loss': round(absolute_gdp_loss, 2)
    })

df_results = pd.DataFrame(results_list).sort_values(by='Total_Economic_Loss', ascending=False).reset_index(drop=True)
print(df_results.to_string())
df_results.to_csv("All_States_Quantity_Impact.csv", index=False)