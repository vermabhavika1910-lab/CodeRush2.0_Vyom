"""
Unified async LLM client for multi-provider inference.
Supports: Groq, OpenRouter, Google AI Studio, GitHub Models.
"""
import os
import time
import json
import httpx
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class LLMResponse:
    text: str
    model: str
    provider: str
    tokens_used: int
    latency_ms: float
    raw: Optional[Dict[str, Any]] = field(default_factory=dict)


# ─── Model registry: maps user-facing name → (provider, api_model_id) ────────
MODEL_REGISTRY: Dict[str, Dict[str, str]] = {
    # Groq models (fastest inference)
    "Llama 3.3 70B (Groq)":       {"provider": "groq",        "model_id": "llama-3.3-70b-versatile"},
    "Llama 3.1 8B (Groq)":        {"provider": "groq",        "model_id": "llama-3.1-8b-instant"},
    "Mixtral 8x7B (Groq)":        {"provider": "groq",        "model_id": "mixtral-8x7b-32768"},
    "Gemma 2 9B (Groq)":          {"provider": "groq",        "model_id": "gemma2-9b-it"},

    # OpenRouter models (multi-provider gateway)
    "GPT-4o (OpenRouter)":         {"provider": "openrouter",  "model_id": "openai/gpt-4o"},
    "Claude 3.5 Sonnet (OpenRouter)": {"provider": "openrouter", "model_id": "anthropic/claude-3.5-sonnet"},
    "Gemini 2.0 Flash (OpenRouter)":  {"provider": "openrouter", "model_id": "google/gemini-2.0-flash-exp"},
    "Llama 3.1 405B (OpenRouter)":    {"provider": "openrouter", "model_id": "meta-llama/llama-3.1-405b-instruct"},

    # Google AI Studio (Gemini native)
    "Gemini 1.5 Pro (Google)":     {"provider": "google",      "model_id": "gemini-1.5-pro"},
    "Gemini 1.5 Flash (Google)":   {"provider": "google",      "model_id": "gemini-1.5-flash"},
    "Gemini 2.0 Flash (Google)":   {"provider": "google",      "model_id": "gemini-2.0-flash-exp"},

    # GitHub Models (Azure-hosted)
    "GPT-4o (GitHub)":             {"provider": "github",      "model_id": "gpt-4o"},
    "GPT-4o Mini (GitHub)":        {"provider": "github",      "model_id": "gpt-4o-mini"},
    "Phi-3.5 Mini (GitHub)":       {"provider": "github",      "model_id": "Phi-3.5-mini-instruct"},
}


def get_providers_and_models() -> List[Dict[str, Any]]:
    """Return model list grouped by provider for the frontend."""
    groups: Dict[str, List[Dict[str, str]]] = {}
    for display_name, info in MODEL_REGISTRY.items():
        provider = info["provider"]
        if provider not in groups:
            groups[provider] = []
        groups[provider].append({
            "display_name": display_name,
            "model_id": info["model_id"],
        })

    provider_meta = {
        "groq":       {"label": "⚡ Groq (Ultra-Fast)", "color": "#f97316"},
        "openrouter": {"label": "🌐 OpenRouter (Multi-Provider)", "color": "#8b5cf6"},
        "google":     {"label": "🔷 Google AI Studio (Gemini)", "color": "#3b82f6"},
        "github":     {"label": "🐙 GitHub Models (Azure)", "color": "#22c55e"},
    }

    result = []
    for provider_key, models in groups.items():
        meta = provider_meta.get(provider_key, {"label": provider_key, "color": "#64748b"})
        result.append({
            "provider": provider_key,
            "label": meta["label"],
            "color": meta["color"],
            "models": models,
        })
    return result


class LLMClient:
    """Async multi-provider LLM client."""

    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY", "")
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        self.google_key = os.getenv("GOOGLE_AI_KEY", "")
        self.github_key = os.getenv("GITHUB_MODELS_KEY", "")
        self._client = httpx.AsyncClient(timeout=60.0)

    async def call(
        self,
        model_display_name: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
    ) -> LLMResponse:
        """
        Dispatch to the correct provider based on the model display name.
        Falls back to Groq llama-3.1-8b-instant if the model name is not recognized.
        """
        info = MODEL_REGISTRY.get(model_display_name)

        # Fallback: try to match legacy names from templates
        if info is None:
            info = self._resolve_legacy_model(model_display_name)

        provider = info["provider"]
        model_id = info["model_id"]

        dispatch = {
            "groq": self._call_groq,
            "openrouter": self._call_openrouter,
            "google": self._call_google,
            "github": self._call_github,
        }

        handler = dispatch.get(provider, self._call_groq)
        return await handler(model_id, messages, temperature, provider)

    def _resolve_legacy_model(self, name: str) -> Dict[str, str]:
        """Map old model names (e.g. 'Gemini 1.5 Pro', 'GPT-4o') to registry entries."""
        legacy_map = {
            "gemini 1.5 pro":     {"provider": "google",      "model_id": "gemini-1.5-pro"},
            "gemini 1.5 flash":   {"provider": "google",      "model_id": "gemini-1.5-flash"},
            "gemini 2.0 flash":   {"provider": "google",      "model_id": "gemini-2.0-flash-exp"},
            "gpt-4o":             {"provider": "github",      "model_id": "gpt-4o"},
            "claude 3.5 sonnet":  {"provider": "openrouter",  "model_id": "anthropic/claude-3.5-sonnet"},
        }
        return legacy_map.get(name.lower(), {"provider": "groq", "model_id": "llama-3.1-8b-instant"})

    # ─── Groq (OpenAI-compatible) ─────────────────────────────────────────────

    async def _call_groq(
        self, model_id: str, messages: List[Dict], temperature: float, provider: str = "groq"
    ) -> LLMResponse:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1024,
        }

        start = time.time()
        resp = await self._client.post(url, json=payload, headers=headers)
        latency = (time.time() - start) * 1000

        resp.raise_for_status()
        data = resp.json()

        text = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", 0)

        return LLMResponse(
            text=text, model=model_id, provider=provider,
            tokens_used=tokens, latency_ms=round(latency, 1), raw=data,
        )

    # ─── OpenRouter (OpenAI-compatible) ───────────────────────────────────────

    async def _call_openrouter(
        self, model_id: str, messages: List[Dict], temperature: float, provider: str = "openrouter"
    ) -> LLMResponse:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Multi-Agent LLM Flow Architect",
        }
        payload = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1024,
        }

        start = time.time()
        try:
            resp = await self._client.post(url, json=payload, headers=headers)
            latency = (time.time() - start) * 1000
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            # Fallback to Groq if OpenRouter API fails
            print(f"OpenRouter API failed: {e}, falling back to Groq")
            return await self._call_groq("llama-3.1-8b-instant", messages, temperature, "groq")

        text = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", 0)

        return LLMResponse(
            text=text, model=model_id, provider=provider,
            tokens_used=tokens, latency_ms=round(latency, 1), raw=data,
        )

    # ─── Google AI Studio (Generative Language API) ───────────────────────────

    async def _call_google(
        self, model_id: str, messages: List[Dict], temperature: float, provider: str = "google"
    ) -> LLMResponse:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}"
            f":generateContent?key={self.google_key}"
        )
        headers = {"Content-Type": "application/json"}

        # Convert OpenAI-style messages to Google Gemini format
        contents = []
        system_instruction = None
        for msg in messages:
            role = msg["role"]
            if role == "system":
                system_instruction = msg["content"]
                continue
            gemini_role = "user" if role == "user" else "model"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": msg["content"]}]
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 1024,
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        start = time.time()
        try:
            resp = await self._client.post(url, json=payload, headers=headers)
            latency = (time.time() - start) * 1000
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            # Fallback to Groq if Google API fails
            print(f"Google API failed: {e}, falling back to Groq")
            return await self._call_groq("llama-3.1-8b-instant", messages, temperature, "groq")

        # Extract text from Gemini response
        text = ""
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            text = "".join(p.get("text", "") for p in parts)

        tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)

        return LLMResponse(
            text=text, model=model_id, provider=provider,
            tokens_used=tokens, latency_ms=round(latency, 1), raw=data,
        )

    # ─── GitHub Models (Azure-hosted, OpenAI-compatible) ──────────────────────

    async def _call_github(
        self, model_id: str, messages: List[Dict], temperature: float, provider: str = "github"
    ) -> LLMResponse:
        url = "https://models.inference.ai.azure.com/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.github_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1024,
        }

        start = time.time()
        try:
            resp = await self._client.post(url, json=payload, headers=headers)
            latency = (time.time() - start) * 1000
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            # Fallback to Groq if GitHub API fails
            print(f"GitHub API failed: {e}, falling back to Groq")
            return await self._call_groq("llama-3.1-8b-instant", messages, temperature, "groq")

        text = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", 0)

        return LLMResponse(
            text=text, model=model_id, provider=provider,
            tokens_used=tokens, latency_ms=round(latency, 1), raw=data,
        )


# Singleton instance
llm_client = LLMClient()
