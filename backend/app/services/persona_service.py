import os
import json
from typing import List, Dict, Any
from groq import Groq

class PersonaService:
    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"
        self.all_personas = self._load_all_personas()

    def _load_all_personas(self) -> List[Dict[str, Any]]:
        try:
            path = os.path.join(os.path.dirname(__file__), '..', 'data', 'final_dataset_30_per_state.json')
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading persona dataset: {e}")
            return []

    def query_persona_insights(self, query: str, context: Dict[str, Any], selected_region: str = None, mode: str = "persona") -> Dict[str, Any]:
        """
        Uses Groq API to generate insights grounded in simulation results.
        Returns a structured dict with 'summary' and 'opinions' fields.
        """
        # Heuristic: If query mentions a state/UT but no selected_region is passed, try to detect it
        target_region = selected_region
        if not target_region:
            common_states = [
                "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
                "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
                "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
                "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
                "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
                "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
            ]
            for state in common_states:
                if state.lower() in query.lower():
                    target_region = state
                    break

        if mode == "assistant":
            system_prompt = self._build_assistant_prompt(context, query)
        else:
            system_prompt = self._build_system_prompt(context, target_region, query)

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": query,
                    }
                ],
                model=self.model,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=2048,
            )
            response_text = chat_completion.choices[0].message.content.strip()
            
            # Robust JSON extraction (in case of markdown blocks)
            if response_text.startswith("```"):
                # Handle ```json ... ``` or ``` ... ```
                lines = response_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                response_text = "\n".join(lines).strip()
            
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error. Raw text: {response_text[:200]}...")
            return {
                "summary": "The insights engine returned an invalid format. Please try re-running the query.",
                "opinions": [],
                "parse_error": str(e)
            }
        except Exception as e:
            return {
                "summary": f"Service Error: {str(e)}",
                "opinions": [],
                "error": str(e)
            }

    def _build_system_prompt(self, context: Dict[str, Any], target_region: str, query: str) -> str:
        macro = context.get("macro", {})
        distribution = context.get("distribution", {})
        
        # 1. Prioritize Local Personas if a region is detected/selected
        local_personas = []
        if target_region:
            # Filter from full 1,080 dataset
            region_matches = [p for p in self.all_personas if p.get("state", "").lower() == target_region.lower()]
            # Take a diverse sample of 15 from this region
            import random
            local_personas = random.sample(region_matches, min(len(region_matches), 15))
        
        # 2. Add Simulation personas (the ones with high impact)
        sim_personas = context.get("personas", {}).get("personas", [])
        
        # Merge and format
        combined_list = []
        seen_ids = set()
        
        # Local ones first
        for p in local_personas:
            p_id = p.get("uuid", "N/A")
            if p_id in seen_ids: continue
            seen_ids.add(p_id)
            combined_list.append(
                f"- [LOCAL] {p.get('persona', 'Resident')}, {p.get('age')}y/o ({p.get('occupation')} in {p.get('state')}). "
                f"Impact Factor: Unknown (Model context below)"
            )
            
        # Sim ones (with net impact data)
        for p in sim_personas:
            p_id = p.get("id", "N/A")
            if p_id in seen_ids: continue
            seen_ids.add(p_id)
            meta = p.get("metadata", {})
            state = meta.get("state", "India")
            combined_list.append(
                f"- [DATA] {p['name']}, {meta.get('age')}y/o ({meta.get('occupation','Worker')} in {state}). "
                f"Net Impact: {p['netImpact']}. Profile: {p['description']}"
            )
            
        persona_list_str = "\n".join(combined_list[:30]) # Limit context window
        
        region_instruction = f"The user is focused on: {target_region}." if target_region else "The user is looking at national data."
        
        prompt = f"""
You are an expert economic simulator specializing in the Indian economy. Your task is to generate individual "opinions" and a "regional comparison" based on the provided CGE simulation data for India.

{region_instruction}

### MACROECONOMIC CONTEXT (INDIA):
- GDP Growth: {macro.get('gdpGrowth', 'N/A')}
- Gini Coefficient change: {distribution.get('giniChange', 'N/A')}
- Overall Stability: {macro.get('stability', 'N/A')}

### AVAILABLE PERSONAS:
{persona_list_str}

### INSTRUCTIONS:
1. Select 3-4 diverse personas from the [LOCAL] or [DATA] lists above that are most relevant to the user's query.
2. **PRIORITY:** If a region like "{target_region}" is mentioned, you MUST pick personas from that specific region.
3. For each selected persona, generate a "response" object in the JSON format below.
4. Speak in the first person for "opinion". Use a tone suitable for their occupation.
5. **REGIONAL COMPARISON (STRICTLY INDIA):**
   - Estimate the `score` (-100 to 100) for all major Indian states based on how this policy impacts their dominant sectors.
   - **VALID REGIONS:** Andhra Pradesh, Assam, Bihar, Delhi, Gujarat, Haryana, Karnataka, Kerala, Maharashtra, Punjab, Rajasthan, Tamil Nadu, Telangana, Uttar Pradesh, West Bengal, Jammu & Kashmir, etc.
   - **CRITICAL:** DO NOT use states from the USA.

### OUTPUT FORMAT (MANDATORY JSON):
{{
  "summary": "Short overview of the persona perspectives for this query.",
  "opinions": [
    {{
      "name": "Persona Name",
      "age": 123,
      "location": "State, Zone",
      "occupation": "Primary Job Title",
      "impact": "Positive/Negative/Neutral",
      "sentiment": "positive/neutral/negative",
      "confidence": 0.85,
      "opinion": "Subjective first-person response.",
      "data_grounding": "Brief technical rationale based on simulation context."
    }}
  ],
  "regional_comparison": {{
    "Maharashtra": {{ "score": 75, "label": "Gaining" }},
    "Bihar": {{ "score": -30, "label": "Under Stress" }}
  }}
}}

Include as many Indian states as possible (10+) in 'regional_comparison'.
Only output the JSON object. No other text.
"""
        return prompt

    def _format_tab_context(self, context: Dict[str, Any], step: str) -> str:
        """Extracts specific data points relevant to the current UI tab."""
        macro = context.get("macro", {})
        distribution = context.get("distribution", {})
        
        if "Macro" in step:
            sectors = macro.get("sectors", [])
            sec_str = "\n".join([f"- {s['name']}: {s['delta']}" for s in sectors[:10]])
            regional = macro.get("regionalImpactMap", {})
            reg_count = len(regional) if regional else 0
            prices = macro.get("factorPrices", {})
            return f"""
SECTORS LOADED:
{sec_str}
REGIONAL COVERAGE: {reg_count} states solved in CGE heatmap.
FACTOR PRICES: Labor change {prices.get('labor', 'N/A')}, Capital change {prices.get('capital', 'N/A')}
"""
        elif "Distribution" in step:
            segments = distribution.get("segments", [])
            seg_str = "\n".join([f"- {s['segmentLabel']} ({s['name']}): {s['delta']} impact. {s['description']}" for s in segments])
            return f"DISTRIBUTIONAL IMPACTS:\n{seg_str}\nGINI DELTA: {distribution.get('giniDelta', 'N/A')}"
            
        elif "Persona" in step:
            personas = context.get("personas", {}).get("personas", [])
            p_str = "\n".join([f"- {p['name']} ({p['sector']}): {p['netImpact']} impact" for p in personas[:5]])
            return f"REPRESENTATIVE AGENTS ON SCREEN:\n{p_str}"
            
        elif "Causal" in step or "Causality" in step:
            diag = context.get("causal", {}).get("diagnostic", {})
            return f"CAUSAL DRIVER: {diag.get('primaryDriver', {}).get('label', 'N/A')} leading to {diag.get('downstreamOutcome', {}).get('label', 'N/A')}. Explanation: {diag.get('explanation', '')}"
            
        return "Standard dashboard indicators loaded."

    def _build_assistant_prompt(self, context: Dict[str, Any], query: str) -> str:
        current_step = context.get("currentStep", "Dashboard")
        macro = context.get("macro", {})
        distribution = context.get("distribution", {})
        
        tab_data = self._format_tab_context(context, current_step)
        
        prompt = f"""
You are a Professional Policy Analyst Assistant for the 'Analytical Archive' platform. 

### PLATFORM CONTEXT:
The user is currently viewing the **{current_step}** tab.

### TAB-SPECIFIC DATA (Grounded results for this screen):
{tab_data}

### GLOBAL MACRO INDICATORS:
- GDP Growth: {macro.get('currentMacroTarget', 'N/A')}%
- Gini Delta: {distribution.get('giniDelta', 'N/A')}%
- Summary: {context.get('analysisSummary', {}).get('insightImplication', 'N/A')}

### INSTRUCTIONS:
1. Provide a concise, highly analytical synthesis of the data available on the current screen ({current_step}).
2. **STRICT LIMITATION:** Do NOT mention individual personas or fictional characters from the simulation in your synthesis. 
3. **STRICT LIMITATION:** Do NOT generate a regional comparison map or JSON unless explicitly asked.
4. **DATA ANALYSIS:** Be specific. If a sector is mentioned in the data above, use its name and delta.
5. **SUGGESTED QUESTIONS:** Generate 2-3 relevant "deep dive" questions the user might ask next based on {current_step} data.

### OUTPUT FORMAT (MANDATORY JSON):
{{
  "summary": "Your analytical response here.",
  "opinions": [],
  "regional_comparison": null,
  "suggested_questions": ["Question 1?", "Question 2?"]
}}

Only output the JSON object. No other text.
"""
        return prompt

persona_service = PersonaService()
