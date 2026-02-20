import httpx


class AIService:
    BASE_URL = "http://127.0.0.1:1234/v1/chat/completions"

    @staticmethod
    async def analyze_control(description: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    AIService.BASE_URL,
                    json={
                        "model": "qwen2.5-coder-7b-instruct",
                        "messages": [
                            {"role": "system", "content": "You are a compliance AI expert."},
                            {
                                "role": "user",
                                "content": f"""
                                Analyze this internal control:

                                {description}

                                Provide:
                                - Risk assessment
                                - Gaps
                                - Improvements
                                """,
                            },
                        ],
                        "temperature": 0.2,
                    },
                )

                response.raise_for_status()
                data = response.json()

                return data["choices"][0]["message"]["content"]

        except Exception as e:
            return f"AI Analysis Failed: {str(e)}"