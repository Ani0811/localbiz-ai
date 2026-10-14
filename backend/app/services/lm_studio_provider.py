"""LM Studio inference service provider.

Communicates with LM Studio's local OpenAI-compatible HTTP endpoints.
Never falls back to cloud or hosted models.
"""
import httpx
from typing import List, Dict, Any, Tuple, Optional
from app.config import settings
from app.schemas.health import AIHealthResponse

class LMStudioError(Exception):
    """Base exception for LM Studio communication failures."""
    def __init__(self, message: str, status_code: int = 502, setup_help: Optional[List[str]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.setup_help = setup_help or []

class LMStudioConnectionError(LMStudioError):
    """Raised when LM Studio endpoint is unreachable."""
    pass

class LMStudioTimeoutError(LMStudioError):
    """Raised when LM Studio request exceeds the configured timeout."""
    pass

class LMStudioModelError(LMStudioError):
    """Raised when requested model is not found or fails to execute."""
    pass

class LMStudioProvider:
    def __init__(self):
        self.base_url = settings.lm_studio_base_url.rstrip("/")
        self.model = settings.lm_studio_model
        self.api_key = settings.lm_studio_api_key
        self.timeout = settings.lm_studio_timeout

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def check_health(self) -> AIHealthResponse:
        """Check LM Studio reachability and discover loaded/available models."""
        url = f"{self.base_url}/models"
        instructions = [
            "1. Launch LM Studio on your Windows host.",
            "2. Ensure the Local Server is started (run: `lms server start --bind 0.0.0.0 --cors` or start it via GUI).",
            f"3. Verify model `{self.model}` is downloaded and loaded in memory (`lms load {self.model} --gpu max -y`).",
            f"4. Confirm LM Studio Base URL is set to `{self.base_url}`.",
            "5. If running inside Podman containers, ensure host networking or host.containers.internal is accessible."
        ]
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, headers=self._get_headers())
                if resp.status_code != 200:
                    return AIHealthResponse(
                        status="unreachable",
                        base_url=self.base_url,
                        configured_model=self.model,
                        is_reachable=False,
                        is_model_loaded=False,
                        loaded_models=[],
                        available_models=[],
                        setup_instructions=instructions,
                        error_detail=f"LM Studio responded with status {resp.status_code}: {resp.text[:200]}"
                    )
                
                data = resp.json()
                model_entries = data.get("data", [])
                model_ids = [m.get("id") for m in model_entries if m.get("id")]
                
                # Check if configured model or any model is loaded
                is_configured_loaded = self.model in model_ids
                status = "model_loaded" if is_configured_loaded else ("connected" if model_ids else "no_model_loaded")
                
                return AIHealthResponse(
                    status=status,
                    base_url=self.base_url,
                    configured_model=self.model,
                    is_reachable=True,
                    is_model_loaded=is_configured_loaded or len(model_ids) > 0,
                    loaded_models=model_ids,
                    available_models=model_ids,
                    setup_instructions=[] if is_configured_loaded else [
                        f"Configured model '{self.model}' was not found in loaded models: {model_ids}.",
                        f"Run `lms load {self.model} --gpu max -y` in your terminal or select it in LM Studio."
                    ],
                    error_detail=None
                )
        except httpx.ConnectError as e:
            return AIHealthResponse(
                status="unreachable",
                base_url=self.base_url,
                configured_model=self.model,
                is_reachable=False,
                is_model_loaded=False,
                loaded_models=[],
                available_models=[],
                setup_instructions=instructions,
                error_detail=f"Connection refused at {self.base_url}. Ensure LM Studio server is running."
            )
        except httpx.TimeoutException:
            return AIHealthResponse(
                status="unreachable",
                base_url=self.base_url,
                configured_model=self.model,
                is_reachable=False,
                is_model_loaded=False,
                loaded_models=[],
                available_models=[],
                setup_instructions=instructions,
                error_detail=f"Connection to {self.base_url} timed out."
            )
        except Exception as e:
            return AIHealthResponse(
                status="unreachable",
                base_url=self.base_url,
                configured_model=self.model,
                is_reachable=False,
                is_model_loaded=False,
                loaded_models=[],
                available_models=[],
                setup_instructions=instructions,
                error_detail=str(e)
            )

    async def generate(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int = 1000, 
        temperature: float = 0.7
    ) -> Tuple[str, str]:
        """Call LM Studio /v1/chat/completions with openai-compatible schema."""
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=self._get_headers())
                
                if response.status_code != 200:
                    err_msg = f"LM Studio API returned error {response.status_code}: {response.text}"
                    raise LMStudioModelError(err_msg, status_code=502)

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise LMStudioModelError("LM Studio returned empty choices list.", status_code=502)

                message = choices[0].get("message", {})
                content = message.get("content", "")
                
                # Handle reasoning models (such as Nemotron) where text may land in reasoning_content
                if not content or content.strip() == "":
                    reasoning = message.get("reasoning_content", "")
                    if reasoning:
                        # Extract the final answer or use reasoning if content is blank
                        content = reasoning.strip()

                if not content:
                    raise LMStudioModelError("LM Studio generated blank content.", status_code=502)

                model_used = data.get("model", self.model)
                return content.strip(), model_used

        except httpx.ConnectError:
            raise LMStudioConnectionError(
                f"Cannot connect to LM Studio at {self.base_url}. Please ensure LM Studio is running and local server is active.",
                status_code=503,
                setup_help=[
                    "Run `lms server start --bind 0.0.0.0 --cors` in PowerShell/Terminal.",
                    f"Run `lms load {self.model} --gpu max -y`.",
                    f"Check if {self.base_url} is reachable from this machine or container."
                ]
            )
        except httpx.TimeoutException:
            raise LMStudioTimeoutError(
                f"LM Studio inference timed out after {self.timeout} seconds.",
                status_code=504,
                setup_help=[
                    "The local model took too long to generate text.",
                    "Consider offloading more layers to GPU with `lms load --gpu max`.",
                    "Or select a smaller quantized model (e.g., 3B-4B Q4_K_M)."
                ]
            )
        except LMStudioError:
            raise
        except Exception as e:
            raise LMStudioError(f"Unexpected inference error: {str(e)}", status_code=500)

lm_provider = LMStudioProvider()
