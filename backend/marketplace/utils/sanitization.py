import html
import re

TAG_RE = re.compile(r"<[^>]+>")

def sanitize_text(value: str) -> str:
    if not value:
        return value
    cleaned = TAG_RE.sub("", value)
    return html.escape(cleaned.strip())