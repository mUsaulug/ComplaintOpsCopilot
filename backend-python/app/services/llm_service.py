from dotenv import load_dotenv
import os
from threading import Lock

from app.core.logging import get_logger
from app.services.llm_providers.base import AbstractLLMProvider

# Load environment early
load_dotenv()

logger = get_logger("complaintops.llm_service")

class LLMFactory:
    _instance = None
    _lock = Lock()
    
    @classmethod
    def get_provider(cls) -> AbstractLLMProvider:
        # Simple Singleton/Factory pattern
        if cls._instance:
            return cls._instance
            
        with cls._lock:
            if cls._instance:
                return cls._instance
                
            provider_type = os.getenv("LLM_PROVIDER", "openai").lower()
            logger.info(f"Initializing LLM Provider: {provider_type}")
            
            try:
                if provider_type == "gemini":
                    from app.services.llm_providers.gemini import GeminiProvider
                    cls._instance = GeminiProvider()
                elif provider_type == "openai":
                    from app.services.llm_providers.openai import OpenAIProvider
                    cls._instance = OpenAIProvider()
                else:
                    logger.warning(f"Unknown provider {provider_type}, falling back to Mock/OpenAI logic or Error")
                    # Fallback or Error. For now let's default to OpenAI which has safe guards
                    from app.services.llm_providers.openai import OpenAIProvider
                    cls._instance = OpenAIProvider()
            except Exception as e:
                logger.error(f"Failed to initialize provider {provider_type}: {e}")
                # Fallback to a safe mock if needed, but for now raise or return basic
                raise e

            return cls._instance

class LLMClient:
    """
    Facade for the active LLM Provider.
    Maintains the same interface as the original LLMClient for compatibility.
    """
    def __init__(self):
        self.mock_mode = False
        # If no API Keys at all, we might want mock mode. 
        # But providers handle their own key checks.
        try:
            self.provider = LLMFactory.get_provider()
        except Exception as e:
            logger.error(f"Could not init LLM Provider: {e}. Switching to Mock Mode.")
            self.mock_mode = True

    def generate_response(self, text: str, category: str, urgency: str, snippets: list) -> dict:
        if self.mock_mode:
             return {
                "action_plan": ["Mock Step 1 (Fallback)", "Mock Step 2"],
                "customer_reply_draft": f"MOCK RESPONSE: Received {category}/{urgency} complaint. Provider init failed.",
                "risk_flags": ["MOCK_MODE_ACTIVE"],
                "sources": [],
                "error_code": None,
            }
        
        return self.provider.generate_response(text, category, urgency, snippets)

# Global Instance
llm_client = LLMClient()
