from pathlib import Path

from app.schemas import GenerateRequest, GenerateResponse, RAGResponse


def test_java_python_contract_alignment():
    java_path = Path(__file__).resolve().parents[2] / "backend-java" / "src" / "main" / "java" / "com" / "complaintops" / "backend" / "DTOs.java"
    java_source = java_path.read_text(encoding="utf-8")

    # Java DTOs should expose the same JSON keys used by Python schemas.
    assert '@JsonProperty("relevant_sources")' in java_source
    assert '@JsonProperty("action_plan")' in java_source
    assert '@JsonProperty("customer_reply_draft")' in java_source
    assert '@JsonProperty("risk_flags")' in java_source
    assert '@JsonProperty("error_code")' in java_source

    assert "relevant_sources" in RAGResponse.model_fields
    assert "relevant_sources" in GenerateRequest.model_fields
    assert "action_plan" in GenerateResponse.model_fields
    assert "customer_reply_draft" in GenerateResponse.model_fields
    assert "risk_flags" in GenerateResponse.model_fields
    assert "error_code" in GenerateResponse.model_fields
