import re


def normalize_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Join words split across PDF line breaks:
    # "im-\nprove" -> "improve"
    # "im- \n prove" -> "improve"
    text = re.sub(
        r"(?<=\w)-[ \t]*\n[ \t]*(?=\w)",
        "",
        text,
    )

    # Remove whitespace immediately before newlines.
    text = re.sub(r"[ \t]+\n", "\n", text)

    # Normalize horizontal whitespace.
    text = re.sub(r"[ \t]+", " ", text)

    # Prevent excessive blank lines.
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def count_words(text: str) -> int:
    if not text:
        return 0

    return len(re.findall(r"\b[\w'-]+\b", text))