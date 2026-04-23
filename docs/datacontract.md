**Data Contract Document: POST /simulate**

**1. Strict JSON Schema**
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SimulationResponse",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "analysisSummary",
    "macro",
    "distribution",
    "personas",
    "causal",
    "policyLab",
    "scenarios"
  ],
  "properties": {
    "analysisSummary": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "netFiscalImpact",
        "confidenceInterval",
        "iterativeDepth",
        "modelDrift",
        "latency",
        "insightTitle",
        "insightImplication",
        "userIntent"
      ],
      "properties": {
        "netFiscalImpact": { "type": "string", "examples": ["+3.8"] },
        "confidenceInterval": { "type": "string", "examples": ["97.2"] },
        "iterativeDepth": { "type": "string", "examples": ["14000 steps"] },
        "modelDrift": { "type": "string", "examples": ["0.002%"] },
        "latency": { "type": "string", "examples": ["38ms"] },
        "insightTitle": { "type": "string", "examples": ["You defined a 2-policy fiscal framework."] },
        "insightImplication": { "type": "string", "examples": ["Projected +3.8% net fiscal surplus with high confidence."] },
        "userIntent": { "type": "string", "examples": ["Configure and run simulation."] }
      }
    },
    "macro": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "insightTitle",
        "insightImplication",
        "contextBridge",
        "userIntent",
        "currentMacroTarget",
        "fiscalYearBaseline",
        "wowDelta",
        "sectors",
        "sideMetrics",
        "activeSimulations"
      ],
      "properties": {
        "insightTitle": { "type": "string", "examples": ["GDP stabilizes at +2.4%."] },
        "insightImplication": { "type": "string", "examples": ["Industrial output leads trajectory."] },
        "contextBridge": { "type": "string", "examples": ["Based on your policy stack..."] },
        "userIntent": { "type": "string", "examples": ["Review aggregate economic outcomes."] },
        "currentMacroTarget": { "type": "string", "examples": ["2.4"] },
        "fiscalYearBaseline": { "type": "string", "examples": ["INR 295.8T"] },
        "wowDelta": { "type": "string", "examples": ["+0.74% WoW"] },
        "sectors": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["name", "subtitle", "value", "delta"],
            "properties": {
              "name": { "type": "string", "examples": ["Industrial Production"] },
              "subtitle": { "type": "string", "examples": ["MANUFACTURING INDEX"] },
              "value": { "type": "number", "examples": [54.2] },
              "delta": { "type": "string", "examples": ["+1.2%"] }
            }
          }
        },
        "sideMetrics": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["label", "value", "unit", "note"],
            "properties": {
              "label": { "type": "string", "examples": ["PRICE INDEX (CPI)"] },
              "value": { "type": "string", "examples": ["4.1"] },
              "unit": { "type": "string", "examples": ["%"] },
              "note": { "type": "string", "examples": ["Inflation within tolerance band."] }
            }
          }
        },
        "activeSimulations": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["name", "status"],
            "properties": {
              "name": { "type": "string", "examples": ["Expansionary Alpha"] },
              "status": { "type": "string", "examples": ["RUNNING"] }
            }
          }
        }
      }
    },
    "distribution": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "insightTitle",
        "insightImplication",
        "contextBridge",
        "userIntent",
        "segments",
        "ledger",
        "giniDelta",
        "methodologyNote"
      ],
      "properties": {
        "insightTitle": { "type": "string", "examples": ["Tax restructuring is progressive."] },
        "insightImplication": { "type": "string", "examples": ["Gini improves by -0.014."] },
        "contextBridge": { "type": "string", "examples": ["Macro growth translates into uneven effects."] },
        "userIntent": { "type": "string", "examples": ["Assess distributional balance."] },
        "segments": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "segmentLabel", "name", "delta", "description", "netImpact"],
            "properties": {
              "id": { "type": "string", "examples": ["lower"] },
              "segmentLabel": { "type": "string", "examples": ["LOWER QUINTILE"] },
              "name": { "type": "string", "examples": ["Consumer Resilience"] },
              "delta": { "type": "string", "examples": ["+7.2"] },
              "description": { "type": "string", "examples": ["Disposable Income Delta"] },
              "netImpact": { "type": "string", "examples": ["+INR 11400 / yr"] }
            }
          }
        },
        "ledger": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["name", "delta"],
            "properties": {
              "name": { "type": "string", "examples": ["Standard Deduction Expansion"] },
              "delta": { "type": "string", "examples": ["+2.3%"] }
            }
          }
        },
        "giniDelta": { "type": "string", "examples": ["-0.014"] },
        "methodologyNote": { "type": "string", "examples": ["Static behavioral response assumption."] }
      }
    },
    "personas": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "insightTitle",
        "insightImplication",
        "contextBridge",
        "userIntent",
        "description",
        "personas"
      ],
      "properties": {
        "insightTitle": { "type": "string", "examples": ["Urban professionals benefit most."] },
        "insightImplication": { "type": "string", "examples": ["Largest beneficiary is far above most affected cohort."] },
        "contextBridge": { "type": "string", "examples": ["Distribution shifts manifest as persona-level changes."] },
        "userIntent": { "type": "string", "examples": ["Identify affected demographic cohorts."] },
        "description": { "type": "string", "examples": ["Benefits concentrated in mid/high income brackets."] },
        "personas": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "id",
              "name",
              "sector",
              "description",
              "netImpact",
              "tag",
              "tagType",
              "breakdown"
            ],
            "properties": {
              "id": { "type": "string", "examples": ["p1"] },
              "name": { "type": "string", "examples": ["Priya Sharma"] },
              "sector": { "type": "string", "examples": ["Urban Professional, Tech Sector"] },
              "description": { "type": "string", "examples": ["Impacted by levy removal and tax holiday."] },
              "netImpact": { "type": "string", "examples": ["+INR 104200"] },
              "tag": { "type": "string", "examples": ["Top 5th Percentile Beneficiary"] },
              "tagType": { "type": "string", "examples": ["positive"] },
              "breakdown": {
                "type": "object",
                "additionalProperties": false,
                "required": ["taxAdjustments", "costOfLiving", "rebateCredit"],
                "properties": {
                  "taxAdjustments": { "type": "string", "examples": ["+INR 38000 / yr"] },
                  "costOfLiving": { "type": "string", "examples": ["-INR 15600 / yr"] },
                  "rebateCredit": { "type": "string", "examples": ["+INR 81800 / yr"] }
                }
              }
            }
          }
        }
      }
    },
    "causal": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "insightTitle",
        "insightImplication",
        "contextBridge",
        "userIntent",
        "nodes",
        "edges",
        "diagnostic"
      ],
      "properties": {
        "insightTitle": { "type": "string", "examples": ["Tax adjustments drive GDP via fiscal multiplier."] },
        "insightImplication": { "type": "string", "examples": ["Employment elasticity is strongest downstream channel."] },
        "contextBridge": { "type": "string", "examples": ["Persona-level impacts are explained by these causal chains."] },
        "userIntent": { "type": "string", "examples": ["Trace causal chain and strongest channels."] },
        "nodes": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "type", "position", "data"],
            "properties": {
              "id": { "type": "string", "examples": ["n1"] },
              "type": { "type": "string", "examples": ["instrument", "variable", "activeChoice", "multiplier"] },
              "position": {
                "type": "object",
                "additionalProperties": false,
                "required": ["x", "y"],
                "properties": {
                  "x": { "type": "number", "examples": [80] },
                  "y": { "type": "number", "examples": [200] }
                }
              },
              "data": {
                "type": "object",
                "additionalProperties": false,
                "required": ["label", "sublabel"],
                "properties": {
                  "label": { "type": "string", "examples": ["Interest Rates"] },
                  "sublabel": { "type": "string", "examples": ["INSTRUMENT"] }
                }
              }
            }
          }
        },
        "edges": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "source", "target", "type"],
            "properties": {
              "id": { "type": "string", "examples": ["e1"] },
              "source": { "type": "string", "examples": ["n1"] },
              "target": { "type": "string", "examples": ["n2"] },
              "type": { "type": "string", "examples": ["active", "latent"] },
              "animated": { "type": "boolean", "examples": [true] }
            }
          }
        },
        "diagnostic": {
          "type": "object",
          "additionalProperties": false,
          "required": ["selectedVariable", "primaryDriver", "downstreamOutcome", "explanation"],
          "properties": {
            "selectedVariable": { "type": "string", "examples": ["Fiscal Multiplier"] },
            "primaryDriver": {
              "type": "object",
              "additionalProperties": false,
              "required": ["name", "value", "label"],
              "properties": {
                "name": { "type": "string", "examples": ["Corporate Tax Adjustment"] },
                "value": { "type": "string", "examples": ["+0.22"] },
                "label": { "type": "string", "examples": ["Marginal Impact"] }
              }
            },
            "downstreamOutcome": {
              "type": "object",
              "additionalProperties": false,
              "required": ["name", "value", "label"],
              "properties": {
                "name": { "type": "string", "examples": ["Regional Employment"] },
                "value": { "type": "string", "examples": ["94%"] },
                "label": { "type": "string", "examples": ["Statistical Confidence"] }
              }
            },
            "explanation": { "type": "string", "examples": ["Detailed causal explanation text."] }
          }
        }
      }
    },
    "policyLab": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "insightTitle",
        "insightImplication",
        "contextBridge",
        "userIntent",
        "simulationStatus",
        "deltaMetrics",
        "refinements",
        "comparisonMatrix",
        "confidence",
        "stochasticDrift"
      ],
      "properties": {
        "insightTitle": { "type": "string", "examples": ["Refinements yield +2.4% GDP with inflation cooling."] },
        "insightImplication": { "type": "string", "examples": ["Short-term fiscal contraction trade-off."] },
        "contextBridge": { "type": "string", "examples": ["System identified refinement opportunities."] },
        "userIntent": { "type": "string", "examples": ["Evaluate and accept/modify/reject optimizations."] },
        "simulationStatus": { "type": "string", "examples": ["Active"] },
        "deltaMetrics": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["label", "value", "unit", "note", "trend"],
            "properties": {
              "label": { "type": "string", "examples": ["GDP GROWTH", "INFLATION", "EMPLOYMENT"] },
              "value": { "type": "string", "examples": ["+2.4", "-0.6", "+98k"] },
              "unit": { "type": "string", "examples": ["%"] },
              "note": { "type": "string", "examples": ["Projected acceleration from reinvestment."] },
              "trend": { "type": "string", "examples": ["up", "down"] },
              "type": { "type": "string", "examples": ["warning"] }
            }
          }
        },
        "refinements": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["name", "priority", "progress"],
            "properties": {
              "name": { "type": "string", "examples": ["Corporate Levy Structuring"] },
              "priority": { "type": "string", "examples": ["PRIORITY A"] },
              "progress": { "type": "number", "examples": [75] }
            }
          }
        },
        "comparisonMatrix": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["metric", "statusQuo", "simX", "simY", "variance", "varType"],
            "properties": {
              "metric": { "type": "string", "examples": ["Marginal Utility per Capita"] },
              "statusQuo": { "type": "string", "examples": ["4.22"] },
              "simX": { "type": "string", "examples": ["4.89"] },
              "simY": { "type": "string", "examples": ["4.45"] },
              "variance": { "type": "string", "examples": ["+15.8%"] },
              "varType": { "type": "string", "examples": ["positive", "negative"] }
            }
          }
        },
        "confidence": { "type": "string", "examples": ["98.2%"] },
        "stochasticDrift": { "type": "string", "examples": ["0.04%"] }
      }
    },
    "scenarios": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "title",
        "insightImplication",
        "contextBridge",
        "userIntent",
        "description",
        "step",
        "stepLabel",
        "metrics",
        "tradeoffData",
        "verdict",
        "reformALabel",
        "reformBLabel"
      ],
      "properties": {
        "title": { "type": "string", "examples": ["Reform A maximizes short-term output but adds long-term overhang."] },
        "insightImplication": { "type": "string", "examples": ["Hybrid path recommended."] },
        "contextBridge": { "type": "string", "examples": ["Scenarios derived from the same policy stack."] },
        "userIntent": { "type": "string", "examples": ["Compare scenarios and commit optimal path."] },
        "description": { "type": "string", "examples": ["Comparative macro trajectory analysis."] },
        "step": { "type": "string", "examples": ["07"] },
        "stepLabel": { "type": "string", "examples": ["FINAL REVIEW"] },
        "metrics": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "name",
              "baseline",
              "reformA",
              "reformADelta",
              "reformB",
              "reformBDelta",
              "reformAType",
              "reformBType"
            ],
            "properties": {
              "name": { "type": "string", "examples": ["GDP Growth Rate"] },
              "sub": { "type": "string", "examples": ["Annualized percentage"] },
              "baseline": { "type": "string", "examples": ["2.1%"] },
              "reformA": { "type": "string", "examples": ["3.4%"] },
              "reformADelta": { "type": "string", "examples": ["up1.3%"] },
              "reformB": { "type": "string", "examples": ["1.4%"] },
              "reformBDelta": { "type": "string", "examples": ["down0.7%"] },
              "reformAType": { "type": "string", "examples": ["positive", "negative"] },
              "reformBType": { "type": "string", "examples": ["positive", "negative"] }
            }
          }
        },
        "tradeoffData": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["name", "growth", "debt"],
            "properties": {
              "name": { "type": "string", "examples": ["Status Quo", "Reform A", "Reform B"] },
              "growth": { "type": "number", "examples": [40] },
              "debt": { "type": "number", "examples": [35] }
            }
          }
        },
        "verdict": {
          "type": "object",
          "additionalProperties": false,
          "required": ["summary", "detail"],
          "properties": {
            "summary": { "type": "string", "examples": ["Reform A maximizes short-term output but creates structural overhang by year 7."] },
            "detail": { "type": "string", "examples": ["Hybrid tertiary path recommended."] }
          }
        },
        "reformALabel": { "type": "string", "examples": ["REFORM A - Fiscal Stimulus"] },
        "reformBLabel": { "type": "string", "examples": ["REFORM B - Austerity Plus"] }
      }
    }
  }
}

**2. Section-by-Section Required Fields with Types and Example Values**

Top-level required fields:
- analysisSummary: object
- macro: object
- distribution: object
- personas: object
- causal: object
- policyLab: object
- scenarios: object

analysisSummary required fields:
- netFiscalImpact: string, example +3.8
- confidenceInterval: string, example 97.2
- iterativeDepth: string, example 14000 steps
- modelDrift: string, example 0.002%
- latency: string, example 38ms
- insightTitle: string, example You defined a 2-policy fiscal framework.
- insightImplication: string, example Projected +3.8% net fiscal surplus with high confidence.
- userIntent: string, example Configure and run simulation.

macro required fields:
- insightTitle: string, example GDP stabilizes at +2.4%.
- insightImplication: string, example Industrial output leads trajectory.
- contextBridge: string, example Based on your policy stack...
- userIntent: string, example Review aggregate economic outcomes.
- currentMacroTarget: string, example 2.4
- fiscalYearBaseline: string, example INR 295.8T
- wowDelta: string, example +0.74% WoW
- sectors: array of objects
- sectors[].name: string, example Industrial Production
- sectors[].subtitle: string, example MANUFACTURING INDEX
- sectors[].value: number, example 54.2
- sectors[].delta: string, example +1.2%
- sideMetrics: array of objects
- sideMetrics[].label: string, example PRICE INDEX (CPI)
- sideMetrics[].value: string, example 4.1
- sideMetrics[].unit: string, example %
- sideMetrics[].note: string, example Inflation within tolerance band.
- activeSimulations: array of objects
- activeSimulations[].name: string, example Expansionary Alpha
- activeSimulations[].status: string, example RUNNING

distribution required fields:
- insightTitle: string, example Tax restructuring is progressive.
- insightImplication: string, example Gini improves by -0.014.
- contextBridge: string, example Macro growth translates into uneven effects.
- userIntent: string, example Assess distributional balance.
- segments: array of objects
- segments[].id: string, example lower
- segments[].segmentLabel: string, example LOWER QUINTILE
- segments[].name: string, example Consumer Resilience
- segments[].delta: string, example +7.2
- segments[].description: string, example Disposable Income Delta
- segments[].netImpact: string, example +INR 11400 / yr
- ledger: array of objects
- ledger[].name: string, example Standard Deduction Expansion
- ledger[].delta: string, example +2.3%
- giniDelta: string, example -0.014
- methodologyNote: string, example Static behavioral response assumption.

personas required fields:
- insightTitle: string, example Urban professionals benefit most.
- insightImplication: string, example Largest beneficiary is far above most affected cohort.
- contextBridge: string, example Distribution shifts manifest as persona-level changes.
- userIntent: string, example Identify affected demographic cohorts.
- description: string, example Benefits concentrated in mid/high income brackets.
- personas: array of objects
- personas[].id: string, example p1
- personas[].name: string, example Priya Sharma
- personas[].sector: string, example Urban Professional, Tech Sector
- personas[].description: string, example Impacted by levy removal and tax holiday.
- personas[].netImpact: string, example +INR 104200
- personas[].tag: string, example Top 5th Percentile Beneficiary
- personas[].tagType: string, example positive
- personas[].breakdown: object
- personas[].breakdown.taxAdjustments: string, example +INR 38000 / yr
- personas[].breakdown.costOfLiving: string, example -INR 15600 / yr
- personas[].breakdown.rebateCredit: string, example +INR 81800 / yr

causal required fields:
- insightTitle: string, example Tax adjustments drive GDP via fiscal multiplier.
- insightImplication: string, example Employment elasticity is strongest downstream channel.
- contextBridge: string, example Persona-level impacts are explained by these causal chains.
- userIntent: string, example Trace causal chain and strongest channels.
- nodes: array of objects
- nodes[].id: string, example n1
- nodes[].type: string, example instrument
- nodes[].position: object
- nodes[].position.x: number, example 80
- nodes[].position.y: number, example 200
- nodes[].data: object
- nodes[].data.label: string, example Interest Rates
- nodes[].data.sublabel: string, example INSTRUMENT
- edges: array of objects
- edges[].id: string, example e1
- edges[].source: string, example n1
- edges[].target: string, example n2
- edges[].type: string, example active
- edges[].animated: boolean, optional only, example true
- diagnostic: object
- diagnostic.selectedVariable: string, example Fiscal Multiplier
- diagnostic.primaryDriver: object
- diagnostic.primaryDriver.name: string, example Corporate Tax Adjustment
- diagnostic.primaryDriver.value: string, example +0.22
- diagnostic.primaryDriver.label: string, example Marginal Impact
- diagnostic.downstreamOutcome: object
- diagnostic.downstreamOutcome.name: string, example Regional Employment
- diagnostic.downstreamOutcome.value: string, example 94%
- diagnostic.downstreamOutcome.label: string, example Statistical Confidence
- diagnostic.explanation: string, example Detailed causal explanation text.

policyLab required fields:
- insightTitle: string, example Refinements yield +2.4% GDP with inflation cooling.
- insightImplication: string, example Short-term fiscal contraction trade-off.
- contextBridge: string, example System identified refinement opportunities.
- userIntent: string, example Evaluate and accept/modify/reject optimizations.
- simulationStatus: string, example Active
- deltaMetrics: array of objects
- deltaMetrics[].label: string, example INFLATION
- deltaMetrics[].value: string, example -0.6
- deltaMetrics[].unit: string, example %
- deltaMetrics[].note: string, example Projected acceleration from reinvestment.
- deltaMetrics[].trend: string, example down
- deltaMetrics[].type: string, optional only, example warning
- refinements: array of objects
- refinements[].name: string, example Corporate Levy Structuring
- refinements[].priority: string, example PRIORITY A
- refinements[].progress: number, example 75
- comparisonMatrix: array of objects
- comparisonMatrix[].metric: string, example Marginal Utility per Capita
- comparisonMatrix[].statusQuo: string, example 4.22
- comparisonMatrix[].simX: string, example 4.89
- comparisonMatrix[].simY: string, example 4.45
- comparisonMatrix[].variance: string, example +15.8%
- comparisonMatrix[].varType: string, example positive
- confidence: string, example 98.2%
- stochasticDrift: string, example 0.04%

scenarios required fields:
- title: string, example Reform A maximizes short-term output but adds long-term overhang.
- insightImplication: string, example Hybrid path recommended.
- contextBridge: string, example Scenarios derived from the same policy stack.
- userIntent: string, example Compare scenarios and commit optimal path.
- description: string, example Comparative macro trajectory analysis.
- step: string, example 07
- stepLabel: string, example FINAL REVIEW
- metrics: array of objects
- metrics[].name: string, example GDP Growth Rate
- metrics[].sub: string, optional only, example Annualized percentage
- metrics[].baseline: string, example 2.1%
- metrics[].reformA: string, example 3.4%
- metrics[].reformADelta: string, example up1.3%
- metrics[].reformB: string, example 1.4%
- metrics[].reformBDelta: string, example down0.7%
- metrics[].reformAType: string, example positive
- metrics[].reformBType: string, example negative
- tradeoffData: array of objects
- tradeoffData[].name: string, example Reform A
- tradeoffData[].growth: number, example 40
- tradeoffData[].debt: number, example 35
- verdict: object
- verdict.summary: string, example Reform A maximizes short-term output but creates structural overhang by year 7.
- verdict.detail: string, example Hybrid tertiary path recommended.
- reformALabel: string, example REFORM A - Fiscal Stimulus
- reformBLabel: string, example REFORM B - Austerity Plus

Optional keys and only optional keys:
- causal.edges[].animated
- policyLab.deltaMetrics[].type
- scenarios.metrics[].sub

**3. Frontend Dependencies**
- simulationService.normalizeSimulationResults: Requires top-level keys analysisSummary, macro, distribution, personas, causal, policyLab, scenarios.
- Main layout context strip: Uses macro.fiscalYearBaseline.
- Scenario drawer: Uses macro.currentMacroTarget and analysisSummary.confidenceInterval.
- Scenario comparison page header: Uses scenarios.title, scenarios.insightImplication, scenarios.contextBridge, scenarios.userIntent.
- Scenario comparison verdict: Uses scenarios.verdict.summary and scenarios.verdict.detail.
- Scenario comparison table: Uses scenarios.metrics[].name, sub, baseline, reformA, reformADelta, reformB, reformBDelta, reformAType, reformBType.
- Scenario comparison scatter: Uses scenarios.tradeoffData[].name, growth, debt.
- Scenario comparison labels: Uses scenarios.reformALabel and scenarios.reformBLabel.
- Multi-scenario diff rows: Uses macro.currentMacroTarget, distribution.giniDelta, analysisSummary.confidenceInterval, analysisSummary.netFiscalImpact.
- Causal explorer graph: Uses causal.nodes and causal.edges.
- Causal graph node click: Uses causal.nodes[].data.label.
- Local optimization fallback analytics: Uses macro.currentMacroTarget, distribution.giniDelta, policyLab.confidence, policyLab.stochasticDrift, and policyLab.deltaMetrics where label equals INFLATION to read value.
- Personas section: Current persona page is local-template driven, but expected backend shape is personas.personas[] with persona card fields.
- Distribution and macro detail pages: Currently local-template driven, but expected backend shapes are distribution and macro structures above.
- Policy lab page: Currently local-template driven, but expected backend shape is policyLab structure above.

**4. Failure Conditions**
- Missing top-level section key: Contract violation; frontend normalizer marks partial and substitutes fallback defaults.
- Missing analysisSummary.confidenceInterval: Scenario drawer and compare confidence row degrade to placeholder values.
- Missing analysisSummary.netFiscalImpact: Compare fiscal row cannot show committed scenario fiscal impact.
- Missing macro.fiscalYearBaseline: Layout context bar loses GDP baseline display.
- Missing macro.currentMacroTarget: Saved scenario GDP metric becomes unavailable; optimization scorecard uses fallback numeric baseline.
- Missing distribution.giniDelta: Compare gini metric unavailable; optimization equity scoring falls back.
- Missing causal.nodes or causal.edges: Causal graph renders empty.
- Missing causal.nodes[].position.x or position.y: Node layout invalid and graph placement breaks.
- Missing causal.nodes[].data.label: Node selection diagnostics cannot resolve selected node context.
- Missing policyLab.confidence or stochasticDrift: Optimization confidence/drift calculations revert to fallback values.
- Missing policyLab.deltaMetrics inflation entry: Optimization stability calculation reverts to fallback inflation value.
- Missing scenarios.metrics: Comparison table has no rows.
- Missing scenarios.tradeoffData: Scatter chart has no plotted points.
- Missing scenarios.verdict: Generic fallback verdict text shown instead of simulation-specific conclusion.
- Missing scenarios.reformALabel or reformBLabel: Reform naming in comparison cards/table becomes generic.
- Missing personas.personas: Persona card rendering cannot be bound once backend integration replaces local template.