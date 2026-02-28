import httpx
from app.core.config import settings


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
            return f"AI Error: {str(e)}"

    @staticmethod
    async def analyze_control(description: str) -> str:
        analysis_prompt = f"""
Analyze the following internal control:

{description}

Provide:
1. Risk assessment
2. Compliance gaps
3. Improvement suggestions
"""

        return await AIService.chat(analysis_prompt)