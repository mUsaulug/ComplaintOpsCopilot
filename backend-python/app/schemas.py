from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal

# === Type Definitions ===

CategoryLiteral = Literal[
    "FRAUD_UNAUTHORIZED_TX",
    "CHARGEBACK_DISPUTE",
    "TRANSFER_DELAY",
    "ACCESS_LOGIN_MOBILE",
    "CARD_LIMIT_CREDIT",
    "INFORMATION_REQUEST",
    "CAMPAIGN_POINTS_REWARDS",
    "UNKNOWN",  # Fallback for failed triage
]

TriageStatus = Literal["OK", "FAILED", "FALLBACK"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]

# --- Shared Models ---

class SourceItem(BaseModel):
    snippet: str
    source: str
    doc_name: str
    chunk_id: str


# --- API Contract Models ---

class MaskingRequest(BaseModel):
    text: str

class MaskingResponse(BaseModel):
    original_text: Optional[str] = None
    masked_text: str
    masked_entities: List[str]

class TriageRequest(BaseModel):
    text: str

class TriageResponse(BaseModel):
    category: CategoryLiteral
    category_confidence: float
    urgency: str
    urgency_confidence: float
    needs_human_review: bool
    model_loaded: bool
    review_status: str
    review_id: Optional[str] = None
    triage_status: TriageStatus = "OK"

class RAGRequest(BaseModel):
    text: str
    category: Optional[str] = None

class RAGResponse(BaseModel):
    relevant_sources: List[SourceItem]

class GenerateRequest(BaseModel):
    text: str
    category: CategoryLiteral
    urgency: str
    relevant_sources: List[SourceItem] = Field(default_factory=list)

class GenerateResponse(BaseModel):
    """Extended response with risk assessment fields."""
    action_plan: List[str]
    customer_reply_draft: str
    risk_flags: List[str]
    sources: List[SourceItem]
    error_code: Optional[str] = None
    # Risk assessment fields
    risk_level: RiskLevel = "MEDIUM"
    risk_reasons: List[str] = Field(default_factory=list)
    needs_human_review: bool = False
    confidence: float = 0.0
    policy_alignment: float = 0.0
    triage_status: TriageStatus = "OK"

class ReviewActionRequest(BaseModel):
    review_id: str
    notes: Optional[str] = None

class ReviewActionResponse(BaseModel):
    review_id: str
    status: str
    notes: Optional[str] = None


# --- LLM Internal Models ---

class LLMResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action_plan: list[str] = Field(min_length=1)
    customer_reply_draft: str = Field(min_length=1)
    category: Optional[CategoryLiteral] = None
    risk_flags: list[str] = Field(min_length=1)
    sources: list[SourceItem] = Field(default_factory=list)
