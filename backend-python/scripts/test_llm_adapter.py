import sys
import os

# Add parent dir to path to find 'app'
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.llm_service import llm_client

def test_gemini_generation():
    print("Testing LLM Client with Gemini Provider...")
    
    complaint = "Kredi kartım çalındı, hemen iptal edin lütfen. Limitim 50 bin TL idi."
    category = "Kredi Kartı"
    urgency = "Yüksek"
    snippets = [
        {"doc_name": "SOP_Lost_Card", "snippet": "If card is lost, immediately block it via Mainframe screen 32B.", "chunk_id": "1"}
    ]
    
    try:
        response = llm_client.generate_response(complaint, category, urgency, snippets)
        print("\nResponse Received:")
        print(response)
        
        if "action_plan" in response:
            print("\nSUCCESS: Action plan generated.")
        else:
            print("\nFAILURE: No action plan.")
            
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_gemini_generation()
