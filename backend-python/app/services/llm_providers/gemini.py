import google.generativeai as genai
import json
import os
from app.services.llm_providers.base import AbstractLLMProvider
from app.core.logging import get_logger

logger = get_logger("complaintops.llm_gemini")

class GeminiProvider(AbstractLLMProvider):
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY not found in environment")
            # We don't raise here to allow app to start, but generation will fail
            
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None

    def generate_response(self, text: str, category: str, urgency: str, snippets: list) -> dict:
        if not self.model:
            return {
                "action_plan": ["Gemini Key Missing"],
                "customer_reply_draft": "System configuration error.",
                "risk_flags": ["CONFIG_ERROR"],
                "sources": [],
                "error_code": "GEMINI_MISSING"
            }

        context = "\n".join(
            f"[{item.get('doc_name', 'unknown')}:{item.get('chunk_id', 'unknown')}] {item.get('snippet', '')}"
            for item in snippets
        )
        
        prompt = f"""
        You are a helpful banking customer support assistant.
        
        Task: Analyze the complaint and provide a structured JSON response.
        
        Context (SOP Snippets):
        {context}
        
        Customer Complaint:
        {text}
        
        Metadata:
        Category: {category}
        Urgency: {urgency}
        
        Output Format:
        Return ONLY valid JSON with this structure:
        {{
            "action_plan": ["step 1", "step 2"],
            "customer_reply_draft": "Turkish response text...",
            "risk_flags": ["flag1"],
            "sources": [
                {{
                    "doc_name": "string",
                    "source": "string",
                    "snippet": "string"
                }}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Cleanup JSON markdown if present
            content = response.text
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            
            parsed = json.loads(content.strip())
            parsed["error_code"] = None
            return parsed
            
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return {
                "action_plan": ["Error calling Gemini"],
                "customer_reply_draft": "System Error: Could not generate draft.",
                "risk_flags": ["LLM_ERROR"],
                "sources": [],
                "error_code": "GEMINI_ERROR"
            }
