class WebhookModerationAdapter:
    @staticmethod
    def parse_boolean(val) -> bool:
        if val is None:
            return False
        if isinstance(val, bool):
            return val
        if isinstance(val, str):
            return val.lower() in ("true", "1", "yes", "on")
        if isinstance(val, (int, float)):
            return bool(val)
        return bool(val)

    @staticmethod
    def create_suspicion_level(has_suspicious: bool, confidence: float | None) -> str:
        if not has_suspicious:
            return "NONE"
        if confidence is not None:
            if confidence >= 90.0:
                return "HIGH"
            if confidence >= 70.0:
                return "MEDIUM"
            return "LOW"
        return "LOW"

    @classmethod
    def adapt(cls, raw: dict) -> dict:
        categories = []
        if raw.get("category"):
            if isinstance(raw["category"], list):
                categories.extend([str(c).strip() for c in raw["category"] if c])
            elif isinstance(raw["category"], str):
                categories.append(raw["category"].strip())
        if raw.get("subcategory"):
            if isinstance(raw["subcategory"], list):
                categories.extend([str(c).strip() for c in raw["subcategory"] if c])
            elif isinstance(raw["subcategory"], str):
                categories.append(raw["subcategory"].strip())
        
        categories = list(set(filter(None, categories)))
        explanation = raw.get("description").strip() if isinstance(raw.get("description"), str) else None
        
        # Extract confidence
        pct = raw.get("confidencePct")
        if pct is not None:
            try:
                confidence = float(pct)
            except ValueError:
                confidence = None
        else:
            conf = raw.get("confidence")
            if conf is not None:
                try:
                    c_val = float(conf)
                    confidence = c_val * 100.0 if c_val <= 1.0 else c_val
                except ValueError:
                    confidence = None
            else:
                confidence = None
        
        has_suspicious = cls.parse_boolean(raw.get("is_illegal"))
        suspicion_level = cls.create_suspicion_level(has_suspicious, confidence)

        return {
            "has_suspicious": has_suspicious,
            "suspicion_level": suspicion_level,
            "categories": categories,
            "confidence": confidence,
            "explanation": explanation,
        }
