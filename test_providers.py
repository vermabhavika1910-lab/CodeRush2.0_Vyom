import os
import json
import sys
# Set env manually or load dotenv
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
from providers import LLMProviderAdapter

messages = [{"role": "user", "content": "What is the capital of France?"}]
schema = {
    "type": "object",
    "properties": {
        "capital": {"type": "string", "description": "Name of the capital city"},
        "confidence": {"type": "number", "description": "0-100"}
    },
    "required": ["capital", "confidence"]
}

print("Testing Groq...")
try:
    res = LLMProviderAdapter.send("groq", "llama-3.1-70b-versatile", messages, schema)
    print("Groq Success:", res)
except Exception as e:
    print("Groq Error:", e)

print("\nTesting Google...")
try:
    res = LLMProviderAdapter.send("google", "gemini-1.5-flash", messages, schema)
    print("Google Success:", res)
except Exception as e:
    print("Google Error:", e)

print("\nTesting OpenRouter...")
try:
    res = LLMProviderAdapter.send("openrouter", "meta-llama/llama-3-8b-instruct", messages, schema)
    print("OpenRouter Success:", res)
except Exception as e:
    print("OpenRouter Error:", e)

print("\nTesting GitHub...")
try:
    res = LLMProviderAdapter.send("github", "gpt-4o", messages, schema)
    print("GitHub Success:", res)
except Exception as e:
    print("GitHub Error:", e)
