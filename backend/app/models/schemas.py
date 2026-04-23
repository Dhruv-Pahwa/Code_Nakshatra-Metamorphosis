from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError


class PipelineError(Exception):
    error_code = "PIPELINE_ERROR"
    module = "pipeline"

    def __init__(
        self,
        message: str,
        *,
        module: str | None = None,
        missing_paths: list[str] | None = None,
        invalid_paths: list[str] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.module = module or self.module
        self.missing_paths = missing_paths or []
        self.invalid_paths = invalid_paths or []

    def to_response(self) -> dict[str, Any]:
        return {
            "errorCode": self.error_code,
            "module": self.module,
            "missingPaths": self.missing_paths,
            "invalidPaths": self.invalid_paths,
            "message": self.message,
        }


class ModuleOutputError(PipelineError):
    error_code = "MODULE_OUTPUT_ERROR"


class ModuleTypeError(PipelineError):
    error_code = "MODULE_TYPE_ERROR"


class AssemblyError(PipelineError):
    error_code = "ASSEMBLY_ERROR"
    module = "response_assembler"


class ContractValidationError(PipelineError):
    error_code = "CONTRACT_VALIDATION_ERROR"
    module = "response_assembler"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class MatchedRuleProvenance(StrictModel):
    id: str
    name: str
    version: str
    sourceFile: str


class SourceMetadata(StrictModel):
    baselineSources: list[str]
    footnotes: list[str]


class SectionProvenance(StrictModel):
    section: str
    matchedRules: list[MatchedRuleProvenance]
    lineageIds: list[str]
    metricLineage: dict[str, list[str]]
    notes: list[str]
    sourceMetadata: SourceMetadata


class SectionNarrative(StrictModel):
    mode: str
    summary: str
    driverSentences: list[str]
    sourceSnippets: list[str]
    frozenNumbers: dict[str, Any]
    guardrail: str
    numberCheckPassed: bool


class AnalysisSummary(StrictModel):
    netFiscalImpact: str
    confidenceInterval: str
    iterativeDepth: str
    modelDrift: str
    latency: str
    insightTitle: str
    insightImplication: str
    userIntent: str
    provenance: SectionProvenance


class MacroSector(StrictModel):
    name: str
    subtitle: str
    value: float
    delta: str


class MacroSideMetric(StrictModel):
    label: str
    value: str
    unit: str
    note: str


class ActiveSimulation(StrictModel):
    name: str
    status: str


class Macro(StrictModel):
    insightTitle: str
    insightImplication: str
    contextBridge: str
    userIntent: str
    currentMacroTarget: str
    fiscalYearBaseline: str
    wowDelta: str
    sectors: list[MacroSector] = Field(min_length=1)
    sideMetrics: list[MacroSideMetric] = Field(min_length=1)
    activeSimulations: list[ActiveSimulation] = Field(min_length=1)
    regionalImpactMap: dict[str, Any] | None = None
    provenance: SectionProvenance
    narrative: SectionNarrative


class DistributionSegment(StrictModel):
    id: str
    segmentLabel: str
    name: str
    delta: str
    description: str
    netImpact: str


class DistributionLedgerItem(StrictModel):
    name: str
    delta: str


class Distribution(StrictModel):
    insightTitle: str
    insightImplication: str
    contextBridge: str
    userIntent: str
    segments: list[DistributionSegment] = Field(min_length=1)
    ledger: list[DistributionLedgerItem] = Field(min_length=1)
    giniDelta: str
    methodologyNote: str
    provenance: SectionProvenance
    narrative: SectionNarrative


class PersonaBreakdown(StrictModel):
    taxAdjustments: str
    costOfLiving: str
    rebateCredit: str


class PersonaItem(StrictModel):
    id: str
    name: str
    sector: str
    description: str
    netImpact: str
    tag: str
    tagType: str
    metadata: dict[str, Any] | None = None
    breakdown: PersonaBreakdown


class Personas(StrictModel):
    insightTitle: str
    insightImplication: str
    contextBridge: str
    userIntent: str
    description: str
    personas: list[PersonaItem] = Field(min_length=1)
    provenance: SectionProvenance
    narrative: SectionNarrative


class CausalPosition(StrictModel):
    x: float
    y: float


class CausalNodeData(StrictModel):
    label: str
    sublabel: str


class CausalNode(StrictModel):
    id: str
    type: str
    position: CausalPosition
    data: CausalNodeData


class CausalEdge(StrictModel):
    id: str
    source: str
    target: str
    type: str
    label: str | None = None
    magnitude: str | None = None
    confidence: str | None = None
    animated: bool | None = None


class CausalDiagnosticMetric(StrictModel):
    name: str
    value: str
    label: str


class CausalDiagnostic(StrictModel):
    selectedVariable: str
    primaryDriver: CausalDiagnosticMetric
    downstreamOutcome: CausalDiagnosticMetric
    explanation: str


class Causal(StrictModel):
    insightTitle: str
    insightImplication: str
    contextBridge: str
    userIntent: str
    nodes: list[CausalNode] = Field(min_length=1)
    edges: list[CausalEdge] = Field(min_length=1)
    diagnostic: CausalDiagnostic
    provenance: SectionProvenance
    narrative: SectionNarrative


class PolicyLabDeltaMetric(StrictModel):
    label: str
    value: str
    unit: str
    note: str
    trend: str
    type: str | None = None


class PolicyLabRefinement(StrictModel):
    name: str
    priority: str
    progress: float


class PolicyLabComparisonRow(StrictModel):
    metric: str
    statusQuo: str
    simX: str
    simY: str
    variance: str
    varType: str


class PolicyLab(StrictModel):
    insightTitle: str
    insightImplication: str
    contextBridge: str
    userIntent: str
    simulationStatus: str
    deltaMetrics: list[PolicyLabDeltaMetric] = Field(min_length=1)
    refinements: list[PolicyLabRefinement] = Field(min_length=1)
    comparisonMatrix: list[PolicyLabComparisonRow] = Field(min_length=1)
    confidence: str
    stochasticDrift: str
    provenance: SectionProvenance
    narrative: SectionNarrative


class ScenarioMetric(StrictModel):
    name: str
    sub: str | None = None
    baseline: str
    reformA: str
    reformADelta: str
    reformB: str
    reformBDelta: str
    reformAType: str
    reformBType: str
    winner: str | None = None
    rationale: str | None = None


class ScenarioTradeoffPoint(StrictModel):
    name: str
    growth: float
    debt: float


class ScenarioVerdict(StrictModel):
    summary: str
    detail: str


class Scenarios(StrictModel):
    title: str
    insightImplication: str
    contextBridge: str
    userIntent: str
    description: str
    step: str
    stepLabel: str
    metrics: list[ScenarioMetric] = Field(min_length=1)
    tradeoffData: list[ScenarioTradeoffPoint] = Field(min_length=1)
    verdict: ScenarioVerdict
    reformALabel: str
    reformBLabel: str
    provenance: SectionProvenance


class SimulationResponse(StrictModel):
    analysisSummary: AnalysisSummary
    macro: Macro
    distribution: Distribution
    personas: Personas
    causal: Causal
    policyLab: PolicyLab
    scenarios: Scenarios


class CgeSolverDiagnostics(StrictModel):
    status: str
    residualNorm: float
    marketClearingNorm: float
    optimality: float
    iterations: int
    solver: str


class CgeSolution(StrictModel):
    converged: bool
    message: str
    diagnostics: CgeSolverDiagnostics
    prices: list[float] = Field(min_length=1)
    wages: list[float] = Field(min_length=1)
    rental_rate: float
    land_rent: float
    tax_revenue: float
    gdp: float
    real_incomes: list[float] = Field(min_length=1)
    nominal_incomes: list[float] = Field(min_length=1)
    cpi: list[float] = Field(min_length=1)
    value_added: list[float] = Field(min_length=1)
    capital: list[float] = Field(min_length=1)
    labor: list[list[float]] = Field(min_length=1)
    total_labor: list[float] = Field(min_length=1)
    demand: list[float] = Field(min_length=1)
    gov_inv_absorption: list[float] = Field(min_length=1)


class CgeScalarDelta(StrictModel):
    absolute: float
    percent: float


class CgeDelta(StrictModel):
    gdp: CgeScalarDelta
    tax_revenue: CgeScalarDelta
    rental_rate: CgeScalarDelta
    land_rent: CgeScalarDelta
    prices: list[CgeScalarDelta] = Field(min_length=1)
    wages: list[CgeScalarDelta] = Field(min_length=1)
    real_incomes: list[CgeScalarDelta] = Field(min_length=1)
    nominal_incomes: list[CgeScalarDelta] = Field(min_length=1)
    value_added: list[CgeScalarDelta] = Field(min_length=1)
    cpi: list[CgeScalarDelta] = Field(min_length=1)


class CgeDiagnosticsBundle(StrictModel):
    baseline: CgeSolverDiagnostics
    scenario: CgeSolverDiagnostics
    invariants: dict[str, float]


class CgeSimulationState(StrictModel):
    parameters: dict[str, Any]
    shocksApplied: dict[str, Any]
    baseline: CgeSolution
    scenario: CgeSolution
    delta: CgeDelta
    diagnostics: CgeDiagnosticsBundle


class PersonaQueryRequest(StrictModel):
    query: str
    context: dict[str, Any]
    selectedRegion: str | None = None
    mode: str = "persona"


def _error_path(error: dict[str, Any]) -> str:
    return ".".join(str(part) for part in error["loc"])


def validate_simulation_response(response: dict[str, Any]) -> dict[str, Any]:
    try:
        validated = SimulationResponse.model_validate(response)
    except ValidationError as exc:
        missing_paths: list[str] = []
        invalid_paths: list[str] = []
        for error in exc.errors():
            path = _error_path(error)
            if error["type"] == "missing":
                missing_paths.append(path)
            else:
                invalid_paths.append(path)
        raise ContractValidationError(
            "Simulation response failed strict contract validation.",
            missing_paths=missing_paths,
            invalid_paths=invalid_paths,
        ) from exc

    return validated.model_dump(exclude_none=True)


def validate_cge_simulation_state(state: dict[str, Any]) -> dict[str, Any]:
    try:
        validated = CgeSimulationState.model_validate(state)
    except ValidationError as exc:
        invalid_paths = [_error_path(error) for error in exc.errors()]
        raise ModuleOutputError(
            "cge_core produced invalid internal simulation state.",
            module="cge_core",
            invalid_paths=invalid_paths,
        ) from exc

    return validated.model_dump()
