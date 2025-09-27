import bleach
from common.config import settings

MAX_INPUT_LEN = 20000

def sanitize_text(text: str) -> str:
    if not text:
        return ""
    cleaned = bleach.clean(text, strip=True)
    if len(cleaned) > MAX_INPUT_LEN:
        return cleaned[:MAX_INPUT_LEN]
    return cleaned
