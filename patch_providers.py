import sys

def patch_providers():
    file_path = "backend/providers.py"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace the `send` method for cascading routing
    old_send = """    @staticmethod
    def send(provider: str, model: str, messages: List[Dict[str, str]], schema: Dict[str, Any], tools: List[str] = None) -> Dict[str, Any]:
        \"\"\"
        provider: 'openai', 'anthropic', 'ollama', or 'mock'
        model: specific model name (e.g., 'gpt-4o', 'llama3', 'claude-3-5-sonnet')
        messages: list of {"role": "...", "content": "..."}
        schema: JSON schema dict that the response MUST conform to
        \"\"\"
        # Calculate cost estimation factors
        start_time = time.time()
        
        # 1. Mock Provider (Zero latency, local execution, guaranteed schema-compliant responses)
        if provider == "mock" or os.environ.get("USE_MOCK_LLM", "false").lower() == "true":
            return LLMProviderAdapter._mock_response(messages, schema, start_time)
            
        # 2. Ollama (Local execution)
        elif provider == "ollama":
            return LLMProviderAdapter._call_ollama(model, messages, schema, start_time)
            
        # 3. OpenAI API
        elif provider == "openai":
            return LLMProviderAdapter._call_openai(model, messages, schema, start_time)
            
        # 4. Anthropic API
        elif provider == "anthropic":
            return LLMProviderAdapter._call_anthropic(model, messages, schema, start_time)
            
        else:
            # Default fallback to mock to maintain system resilience
            return LLMProviderAdapter._mock_response(messages, schema, start_time)"""

    new_send = """    @staticmethod
    def send(provider: str, model: str, messages: List[Dict[str, str]], schema: Dict[str, Any], tools: List[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        
        # --- Cascading Fallback Routing ---
        providers_to_try = [provider]
        
        if provider != "mock":
            if provider == "groq":
                providers_to_try.extend(["openai", "google", "mock"])
            else:
                providers_to_try.extend(["groq", "mock"])
                
        last_error = None
        for current_provider in providers_to_try:
            try:
                if current_provider == "mock" or os.environ.get("USE_MOCK_LLM", "false").lower() == "true":
                    return LLMProviderAdapter._mock_response(messages, schema, start_time)
                elif current_provider == "ollama":
                    return LLMProviderAdapter._call_ollama(model, messages, schema, start_time)
                elif current_provider == "openai":
                    return LLMProviderAdapter._call_openai(model, messages, schema, start_time)
                elif current_provider == "anthropic":
                    return LLMProviderAdapter._call_anthropic(model, messages, schema, start_time)
                elif current_provider == "groq":
                    return LLMProviderAdapter._call_groq(model, messages, schema, start_time)
                elif current_provider == "openrouter":
                    return LLMProviderAdapter._call_openrouter(model, messages, schema, start_time)
                elif current_provider == "github":
                    return LLMProviderAdapter._call_github(model, messages, schema, start_time)
                elif current_provider == "google":
                    return LLMProviderAdapter._call_google(model, messages, schema, start_time)
            except Exception as e:
                last_error = e
                print(f"Provider {current_provider} failed: {e}. Trying next fallback...")
                continue
                
        # If all fail, force mock
        return LLMProviderAdapter._mock_response(messages, schema, start_time)"""
    
    if old_send in content:
        content = content.replace(old_send, new_send)
    else:
        print("Warning: old send method not found, it might have been modified.")

    # 2. Add the new methods
    new_methods = """
    @staticmethod
    def _call_groq(model: str, messages: List[Dict[str, str]], schema: Dict[str, Any], start_time: float) -> Dict[str, Any]:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ProviderError("GROQ_API_KEY missing")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        
        sys_msg = f"You must output valid JSON matching this schema exactly: {json.dumps(schema)}"
        augmented_messages = [{"role": "system", "content": sys_msg}] + [m for m in messages if m["role"] != "system"]
        
        payload = {
            "model": model or "llama-3.1-70b-versatile",
            "messages": augmented_messages,
            "response_format": {"type": "json_object"}
        }
        
        response = httpx.post(url, json=payload, headers=headers, timeout=60.0)
        if response.status_code != 200:
            raise ProviderError(f"Groq error: {response.text}")
            
        data = response.json()
        parsed_json = json.loads(data["choices"][0]["message"]["content"])
        
        total_tokens = data.get("usage", {}).get("total_tokens", 0)
        cost = total_tokens * 0.59 / 1e6 # approx groq cost
        latency = int((time.time() - start_time) * 1000)
        
        return {"content": parsed_json, "tokens": total_tokens, "cost": cost, "latency_ms": latency}

    @staticmethod
    def _call_openrouter(model: str, messages: List[Dict[str, str]], schema: Dict[str, Any], start_time: float) -> Dict[str, Any]:
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key: raise ProviderError("OPENROUTER_API_KEY missing")
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "HTTP-Referer": "http://localhost", "X-Title": "AE-03 Orchestrator"}
        
        sys_msg = f"You must output valid JSON matching this schema: {json.dumps(schema)}"
        augmented_messages = [{"role": "system", "content": sys_msg}] + [m for m in messages if m["role"] != "system"]
        
        payload = {
            "model": model or "meta-llama/llama-3-8b-instruct",
            "messages": augmented_messages,
            "response_format": {"type": "json_object"}
        }
        response = httpx.post(url, json=payload, headers=headers, timeout=60.0)
        if response.status_code != 200: raise ProviderError(f"OpenRouter error: {response.text}")
        data = response.json()
        parsed_json = json.loads(data["choices"][0]["message"]["content"])
        return {"content": parsed_json, "tokens": data.get("usage", {}).get("total_tokens", 0), "cost": 0.0, "latency_ms": int((time.time() - start_time) * 1000)}

    @staticmethod
    def _call_github(model: str, messages: List[Dict[str, str]], schema: Dict[str, Any], start_time: float) -> Dict[str, Any]:
        api_key = os.environ.get("GITHUB_TOKEN")
        if not api_key: raise ProviderError("GITHUB_TOKEN missing")
        url = "https://models.inference.ai.azure.com/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        
        sys_msg = f"You must output valid JSON matching this schema: {json.dumps(schema)}"
        augmented_messages = [{"role": "system", "content": sys_msg}] + [m for m in messages if m["role"] != "system"]
        payload = {"model": model or "gpt-4o", "messages": augmented_messages, "response_format": {"type": "json_object"}}
        response = httpx.post(url, json=payload, headers=headers, timeout=60.0)
        if response.status_code != 200: raise ProviderError(f"Github error: {response.text}")
        data = response.json()
        parsed_json = json.loads(data["choices"][0]["message"]["content"])
        return {"content": parsed_json, "tokens": data.get("usage", {}).get("total_tokens", 0), "cost": 0.0, "latency_ms": int((time.time() - start_time) * 1000)}

    @staticmethod
    def _call_google(model: str, messages: List[Dict[str, str]], schema: Dict[str, Any], start_time: float) -> Dict[str, Any]:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key: raise ProviderError("GEMINI_API_KEY missing")
        
        model_name = model or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        
        google_contents = []
        sys_instructions = ""
        for m in messages:
            if m["role"] == "system":
                sys_instructions += m["content"] + " "
            else:
                google_contents.append({"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]})
                
        payload = {
            "contents": google_contents,
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        if sys_instructions:
            payload["systemInstruction"] = {"parts": [{"text": sys_instructions + f"\\nStrictly output valid JSON matching this schema: {json.dumps(schema)}"}]}
            
        response = httpx.post(url, json=payload, timeout=60.0)
        if response.status_code != 200: raise ProviderError(f"Google error: {response.text}")
        data = response.json()
        raw_content = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed_json = json.loads(raw_content)
        
        tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
        return {"content": parsed_json, "tokens": tokens, "cost": 0.0, "latency_ms": int((time.time() - start_time) * 1000)}
"""

    if "def _call_groq" not in content:
        content += new_methods

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    patch_providers()
