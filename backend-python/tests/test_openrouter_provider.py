"""
OpenRouter Provider Smoke Tests

Bu testler OpenRouter entegrasyonunun temel fonksiyonelliğini doğrular:
1. API key yoksa crash etmeden fallback döner
2. Provider doğru şekilde initialize edilir
3. PII fail-closed davranışı korunur
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestOpenRouterProviderInitialization:
    """Test provider initialization scenarios."""
    
    def test_missing_api_key_does_not_crash(self):
        """
        OPENROUTER_API_KEY yoksa sistem crash etmemeli,
        provider.client = None olmalı.
        """
        # Clear any existing key
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            # Remove key if exists
            if 'OPENROUTER_API_KEY' in os.environ:
                del os.environ['OPENROUTER_API_KEY']
            
            from app.services.llm_providers.openrouter import OpenRouterProvider
            
            # Should not raise exception
            provider = OpenRouterProvider()
            
            # Client should be None
            assert provider.client is None
    
    def test_missing_api_key_returns_fallback_response(self):
        """
        API key yoksa generate_response fallback dictionary döndürmeli.
        """
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': ''}, clear=False):
            if 'OPENROUTER_API_KEY' in os.environ:
                del os.environ['OPENROUTER_API_KEY']
            
            from app.services.llm_providers.openrouter import OpenRouterProvider
            
            provider = OpenRouterProvider()
            result = provider.generate_response(
                text="Test complaint",
                category="FRAUD_UNAUTHORIZED_TX",
                urgency="HIGH",
                snippets=[]
            )
            
            # Should return fallback, not crash
            assert result is not None
            assert "error_code" in result
            assert result["error_code"] == "OPENROUTER_MISSING"
            assert "action_plan" in result
            assert "customer_reply_draft" in result
            assert "risk_flags" in result
            assert "CONFIG_ERROR" in result["risk_flags"]
    
    def test_default_model_is_set(self):
        """
        OPENROUTER_MODEL env yoksa default model kullanılmalı.
        """
        with patch.dict(os.environ, {
            'OPENROUTER_API_KEY': 'test-key',
            'OPENROUTER_MODEL': ''
        }, clear=False):
            if 'OPENROUTER_MODEL' in os.environ:
                del os.environ['OPENROUTER_MODEL']
            
            from app.services.llm_providers.openrouter import OpenRouterProvider
            
            provider = OpenRouterProvider()
            
            # Default model should be set
            assert provider.model == "xiaomi/mimo-vl-flash:free"


class TestOpenRouterProviderSecurity:
    """Test security-related functionality."""
    
    def test_input_sanitization_removes_prompt_injection(self):
        """
        Prompt injection pattern'leri temizlenmeli.
        """
        from app.services.llm_providers.openrouter import OpenRouterProvider
        
        provider = OpenRouterProvider()
        
        # Test various injection patterns
        test_cases = [
            ("Normal text ```code block``` more text", "Normal text  more text"),
            ("Hello <system>hack</system> world", "Hello  world"),
            ("Test <assistant>inject</assistant> end", "Test  end"),
            ("Start <user>malicious</user> finish", "Start  finish"),
        ]
        
        for input_text, expected_contains in test_cases:
            sanitized = provider._sanitize_user_input(input_text)
            # Should not contain the injection patterns
            assert "```" not in sanitized
            assert "<system>" not in sanitized.lower()
            assert "<assistant>" not in sanitized.lower()
            assert "<user>" not in sanitized.lower()
    
    def test_pii_detection_fail_closed(self):
        """
        PII detection hatası durumunda fail-closed: True döndürmeli.
        """
        from app.services.llm_providers.openrouter import OpenRouterProvider
        
        provider = OpenRouterProvider()
        
        # Mock scan_text to raise exception
        with patch('app.services.llm_providers.openrouter.scan_text') as mock_scan:
            mock_scan.side_effect = Exception("Service unavailable")
            
            result = provider._detect_pii("Some text")
            
            # Should return True (assume PII present) when detection fails
            assert result is True


class TestOpenRouterProviderResponseParsing:
    """Test response parsing and validation."""
    
    def test_parse_json_with_markdown_fences(self):
        """
        Markdown code fence'ları temizlenip JSON parse edilmeli.
        """
        from app.services.llm_providers.openrouter import OpenRouterProvider
        
        provider = OpenRouterProvider()
        
        # JSON wrapped in markdown
        content = '''```json
{
    "action_plan": ["Step 1", "Step 2"],
    "customer_reply_draft": "Test response",
    "risk_flags": [],
    "sources": []
}
```'''
        
        result = provider._parse_and_validate(content)
        
        assert result["action_plan"] == ["Step 1", "Step 2"]
        assert result["customer_reply_draft"] == "Test response"
    
    def test_parse_clean_json(self):
        """
        Temiz JSON doğru parse edilmeli.
        """
        from app.services.llm_providers.openrouter import OpenRouterProvider
        
        provider = OpenRouterProvider()
        
        content = '''{
    "action_plan": ["Action 1"],
    "customer_reply_draft": "Reply text",
    "risk_flags": ["FLAG1"],
    "sources": [{"doc_name": "doc1", "source": "src1", "snippet": "text"}]
}'''
        
        result = provider._parse_and_validate(content)
        
        assert len(result["action_plan"]) == 1
        assert result["risk_flags"] == ["FLAG1"]
        assert len(result["sources"]) == 1


class TestOpenRouterProviderIntegration:
    """Integration tests (require mocking external calls)."""
    
    def test_successful_api_call_returns_parsed_response(self):
        """
        Başarılı API çağrısı parse edilmiş response döndürmeli.
        """
        from app.services.llm_providers.openrouter import OpenRouterProvider
        
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test-key'}):
            provider = OpenRouterProvider()
            
            # Mock the OpenAI client
            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = '''{
                "action_plan": ["Test step"],
                "customer_reply_draft": "Test reply",
                "risk_flags": [],
                "sources": []
            }'''
            
            with patch.object(provider.client.chat.completions, 'create', return_value=mock_response):
                with patch('app.services.llm_providers.openrouter.scan_text') as mock_scan:
                    mock_scan.return_value = MagicMock(contains_pii=False)
                    
                    result = provider.generate_response(
                        text="Test complaint",
                        category="TRANSFER_DELAY",
                        urgency="MEDIUM",
                        snippets=[]
                    )
            
            assert result["error_code"] is None
            assert "Test step" in result["action_plan"]
            assert result["customer_reply_draft"] == "Test reply"
    
    def test_api_timeout_returns_fallback(self):
        """
        API timeout durumunda fallback response döndürmeli.
        """
        import httpx
        from app.services.llm_providers.openrouter import OpenRouterProvider
        
        with patch.dict(os.environ, {'OPENROUTER_API_KEY': 'test-key'}):
            provider = OpenRouterProvider()
            
            # Mock timeout exception
            with patch.object(provider.client.chat.completions, 'create', 
                            side_effect=httpx.TimeoutException("Timeout")):
                result = provider.generate_response(
                    text="Test",
                    category="TEST",
                    urgency="LOW",
                    snippets=[]
                )
            
            assert result["error_code"] == "OPENROUTER_ERROR"
            assert "LLM_UNAVAILABLE" in result["risk_flags"]


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
