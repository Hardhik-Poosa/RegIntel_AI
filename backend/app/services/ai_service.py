import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

AI_UNAVAILABLE = (
    "AI analysis is temporarily unavailable. "
    "Your control has been saved — please try the AI analysis again later."
)


class AIService:
    @property
    def BASE_URL(self):
        return settings.AI_BASE_URL

    @property
    def MODEL(self):
        return settings.AI_MODEL

    @staticmethod
    async def chat(prompt: str) -> str:
        svc = AIService()
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    svc.BASE_URL,
                    json={
                        "model": svc.MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an intelligent compliance AI assistant."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.3
                    }
                )

                response.raise_for_status()
                data = response.json()

                return data["choices"][0]["message"]["content"]

        except Exception as e:
            logger.warning("AI service call failed: %s", e)
            return AI_UNAVAILABLE

    @staticmethod
    async def analyze_control(description: str) -> str:
        """
        Ask the AI to return a structured JSON analysis.
        Falls back to a plain text prompt if the model returns non-JSON.
        """
        json_prompt = f"""You are a compliance AI assistant. Analyze the following internal control and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

JSON schema:
{{
  "suggested_risk": "HIGH|MEDIUM|LOW",
  "category": "ACCESS_CONTROL|DATA_PROTECTION|INCIDENT_RESPONSE|VENDOR_MANAGEMENT|EMPLOYEE_TRAINING|AUDIT|OTHER",
  "confidence": <float 0.0–1.0>,
  "gaps": ["gap1", "gap2"],
  "recommendations": ["rec1", "rec2"],
  "summary": "One sentence summary."
}}

Control description:
{description}"""
        return await AIService.chat(json_prompt)