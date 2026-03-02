"""
Regulatory Update Engine.

Fetches the latest compliance and regulatory news from curated RSS feeds.
Results are cached in-memory for 1 hour to avoid hammering external services.

In production, extend this with:
  - Webhook subscriptions to official regulatory bodies
  - LLM-powered summarisation of each update
  - Relevance scoring per organisation's framework subscriptions
"""
from __future__ import annotations

import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ── Curated RSS feeds for compliance / regulatory news ────────────────────────
REGULATORY_FEEDS: list[dict] = [
    {
        "id": "rbi",
        "name": "RBI Press Releases",
        "url": "https://rbi.org.in/Scripts/rss.aspx",
        "category": "Financial",
        "jurisdiction": "India",
    },
    {
        "id": "sebi",
        "name": "SEBI Circulars",
        "url": "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFbo=yes&intmId=10",
        "category": "Financial",
        "jurisdiction": "India",
    },
    {
        "id": "nist",
        "name": "NIST Cybersecurity News",
        "url": "https://www.nist.gov/news-events/cybersecurity/rss.xml",
        "category": "Security",
        "jurisdiction": "Global",
    },
    {
        "id": "euai",
        "name": "EU AI Act Updates",
        "url": "https://digital-strategy.ec.europa.eu/en/rss.xml",
        "category": "AI Governance",
        "jurisdiction": "EU",
    },
    {
        "id": "pcissc",
        "name": "PCI Security Standards",
        "url": "https://blog.pcisecuritystandards.org/rss.xml",
        "category": "Security",
        "jurisdiction": "Global",
    },
]

# Simple in-memory cache: {feed_id: (timestamp, items)}
_cache: dict[str, tuple[float, list[dict]]] = {}
CACHE_TTL = 3600   # 1 hour


async def _fetch_rss(url: str, feed_name: str, category: str, jurisdiction: str) -> list[dict]:
    """Parse an RSS feed via httpx + minimal XML parsing (no feedparser dependency)."""
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "RegintelAI/1.0 Compliance Monitor"})
            if resp.status_code != 200:
                return []

        import xml.etree.ElementTree as ET
        root = ET.fromstring(resp.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        # Handle both RSS 2.0 <item> and Atom <entry>
        entries = root.findall(".//item") or root.findall(".//atom:entry", ns) or root.findall(".//entry")

        for entry in entries[:10]:
            def _text(tag: str) -> str:
                el = entry.find(tag) or entry.find(f"atom:{tag}", ns)
                return (el.text or "").strip() if el is not None else ""

            title = _text("title")
            link  = _text("link")
            if not link:
                link_el = entry.find("link")
                if link_el is not None:
                    link = link_el.get("href", "")
            pub = _text("pubDate") or _text("published") or _text("updated")

            if title:
                items.append({
                    "title":       title,
                    "link":        link,
                    "published":   pub,
                    "source":      feed_name,
                    "category":    category,
                    "jurisdiction": jurisdiction,
                })
    except Exception as exc:
        logger.warning("RSS fetch failed for %s: %s", url, exc)

    return items


class RegulatoryService:

    @staticmethod
    async def fetch_updates(force_refresh: bool = False) -> list[dict[str, Any]]:
        """
        Fetch regulatory updates from all configured feeds.
        Returns merged list sorted by source, de-duplicated by URL.
        Results are cached for CACHE_TTL seconds.
        """
        all_items: list[dict] = []
        now = time.time()

        for feed in REGULATORY_FEEDS:
            fid = feed["id"]
            cached_at, cached_items = _cache.get(fid, (0.0, []))

            if not force_refresh and (now - cached_at) < CACHE_TTL and cached_items:
                all_items.extend(cached_items)
                continue

            items = await _fetch_rss(feed["url"], feed["name"], feed["category"], feed["jurisdiction"])
            _cache[fid] = (now, items)
            all_items.extend(items)

        # De-duplicate by link
        seen: set[str] = set()
        unique: list[dict] = []
        for item in all_items:
            key = item.get("link", item["title"])
            if key not in seen:
                seen.add(key)
                unique.append(item)

        return unique

    @staticmethod
    def list_feeds() -> list[dict]:
        return REGULATORY_FEEDS
