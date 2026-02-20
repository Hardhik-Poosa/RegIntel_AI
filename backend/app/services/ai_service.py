import httpx


class AIService:
    BASE_URL = "http://127.0.0.1:1234/v1/chat/completions"
    MODEL = "qwen2.5-coder-7b-instruct"

    @staticmethod
    async def chat(prompt: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    AIService.BASE_URL,
                    json={
                        "model": AIService.MODEL,
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