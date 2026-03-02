"""
AI Evidence Scanner Service.

Given a file path + name, extracts text content and asks the LLM whether
the document constitutes valid compliance evidence for the associated control.

Supported formats (text extraction):
  - .txt, .md, .csv, .json, .xml  → read directly
  - .pdf                          → pdfminer (optional, graceful fallback)
  - all others                    → treat as binary, use filename only
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path

from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

MAX_TEXT_CHARS = 6000   # prevent overwhelming the LLM context


def _extract_text(file_url: str, mime_type: str | None) -> str:
    """Best-effort text extraction from the file."""
    path = Path(file_url)
    if not path.is_file():
        return f"[File not found locally: {path.name}]"

    # PDF via pdfminer
    if mime_type == "application/pdf" or path.suffix.lower() == ".pdf":
        try:
            from pdfminer.high_level import extract_text as pdf_extract
            text = pdf_extract(str(path))
            return text[:MAX_TEXT_CHARS]
        except ImportError:
            pass
        except Exception as exc:
            logger.warning("PDF extraction failed for %s: %s", path.name, exc)

    # Plain text / code / data formats
    text_exts = {".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml",
                 ".log", ".html", ".rst", ".py"}
    if path.suffix.lower() in text_exts:
        try:
            return path.read_text(encoding="utf-8", errors="replace")[:MAX_TEXT_CHARS]
        except Exception as exc:
            logger.warning("Text read failed for %s: %s", path.name, exc)

    # Binary fallback — filename + size only
    size = os.path.getsize(file_url) if os.path.isfile(file_url) else 0
    return f"[Binary file: {path.name}, size: {size} bytes]"


class EvidenceAIScanner:

    @staticmethod
    async def analyze(file_url: str, file_name: str, mime_type: str | None = None) -> dict:
        """
        Analyse an uploaded file and return:
            {
              "valid": bool,
              "confidence": float,   # 0.0 – 1.0
              "explanation": str
            }
        Falls back to {"valid": None, "confidence": 0.0, "explanation": "..."} on error.
        """
        file_text = _extract_text(file_url, mime_type)

        prompt = f"""You are a compliance evidence assessor.
Determine whether the following document qualifies as valid compliance evidence.

File name: {file_name}
File content (truncated to {MAX_TEXT_CHARS} chars):
---
{file_text}
---

Respond ONLY with a JSON object — no markdown fences, no extra text:
{{
  "valid": true or false,
  "confidence": 0.0 to 1.0,
  "explanation": "one or two sentences explaining your verdict"
}}"""

        system_prompt = (
            "You are RegintelAI Evidence Assessor. "
            "Return ONLY valid JSON, nothing else."
        )

        try:
            raw = await AIService.chat(prompt, system_prompt=system_prompt)
            # Strip markdown fences if present
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw.strip())
            return {
                "valid":       bool(result.get("valid", False)),
                "confidence":  float(result.get("confidence", 0.5)),
                "explanation": str(result.get("explanation", "")),
            }
        except Exception as exc:
            logger.error("Evidence AI scan failed for %s: %s", file_name, exc)
            return {
                "valid":       None,
                "confidence":  0.0,
                "explanation": f"AI scan unavailable: {exc}",
            }
