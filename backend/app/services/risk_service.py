"""
Risk Forecasting service.

Provides deterministic (no AI needed) risk predictions based on current
control state.  Phase 4D / 5 can replace heuristics with ML models.
"""
from __future__ import annotations

from typing import List


RISK_WEIGHT  = {"HIGH": 10, "MEDIUM": 5, "LOW": 2}
STATUS_MULT  = {"IMPLEMENTED": 1.0, "PARTIAL": 0.5, "MISSING": 0.0}


def _status(c) -> str:
    return c.status.value if hasattr(c.status, "value") else str(c.status)

def _risk(c) -> str:
    return c.risk_score.value if hasattr(c.risk_score, "value") else str(c.risk_score)


class RiskForecastService:

    @staticmethod
    def potential_gain(controls) -> dict:
        """
        Calculate how many compliance points could be gained by fixing all
        MISSING controls. Also breaks down the top items to fix.

        Returns
        -------
        {
            "max_possible_gain": int,   # points if all MISSING become IMPLEMENTED
            "priority_fixes": [
                {"title": str, "risk": str, "potential_gain": int}, …
            ]
        }
        """
        total_w  = sum(RISK_WEIGHT.get(_risk(c), 5) for c in controls)
        if not total_w:
            return {"max_possible_gain": 0, "priority_fixes": []}

        current_score = round(
            sum(
                RISK_WEIGHT.get(_risk(c), 5) * STATUS_MULT.get(_status(c), 0.0)
                for c in controls
            ) / total_w * 100
        )

        # Score if every MISSING control were IMPLEMENTED
        all_impl_score = round(
            sum(
                RISK_WEIGHT.get(_risk(c), 5) * (
                    1.0 if _status(c) == "MISSING" else STATUS_MULT.get(_status(c), 0.0)
                )
                for c in controls
            ) / total_w * 100
        )

        max_gain = all_impl_score - current_score

        # Per-control gain if that control were fixed
        priority_fixes = sorted(
            [
                {
                    "title":          c.title,
                    "risk":           _risk(c),
                    "current_status": _status(c),
                    "potential_gain": round(
                        RISK_WEIGHT.get(_risk(c), 5)
                        * (1.0 - STATUS_MULT.get(_status(c), 0.0))
                        / total_w * 100
                    ),
                }
                for c in controls
                if _status(c) != "IMPLEMENTED"
            ],
            key=lambda x: x["potential_gain"],
            reverse=True,
        )[:10]  # top 10 biggest wins

        return {
            "current_score":   current_score,
            "max_possible_gain": max_gain,
            "priority_fixes":  priority_fixes,
        }

    @staticmethod
    def predict_trend(snapshots, controls) -> dict:
        """
        Very simple heuristic trend prediction.

        If the last 3 snapshots are declining → flag as 'declining'.
        If there are HIGH-risk MISSING controls → project score drop.
        """
        scores = [s.score for s in sorted(snapshots, key=lambda s: s.created_at)]

        if len(scores) < 2:
            trend = "insufficient_data"
        else:
            recent = scores[-3:] if len(scores) >= 3 else scores
            if all(recent[i] <= recent[i - 1] for i in range(1, len(recent))):
                trend = "declining"
            elif all(recent[i] >= recent[i - 1] for i in range(1, len(recent))):
                trend = "improving"
            else:
                trend = "stable"

        # Count critical unaddressed risks
        high_missing = [c for c in controls if _risk(c) == "HIGH" and _status(c) == "MISSING"]

        return {
            "trend": trend,
            "high_missing_count": len(high_missing),
            "risk_warning": (
                f"You have {len(high_missing)} HIGH-risk controls still MISSING. "
                f"If unresolved, your compliance score may continue to decline."
            ) if high_missing else None,
        }
