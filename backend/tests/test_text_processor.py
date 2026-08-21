from app.services.text_processor import (
    count_words,
    normalize_text,
)


def test_normalize_line_endings():
    text = "Hello\r\nWorld\rTest"

    assert normalize_text(text) == "Hello\nWorld\nTest"


def test_remove_excess_blank_lines():
    text = "Section 1\n\n\n\nSection 2"

    assert normalize_text(text) == "Section 1\n\nSection 2"


def test_join_hyphenated_line_break():
    text = "This will im-\nprove the result."

    assert normalize_text(text) == "This will improve the result."


def test_preserve_legitimate_hyphens():
    text = "end-to-end production-grade cross-platform"

    assert normalize_text(text) == (
        "end-to-end production-grade cross-platform"
    )


def test_normalize_spaces():
    text = "Hello     world\t\tagain"

    assert normalize_text(text) == "Hello world again"


def test_remove_trailing_line_whitespace():
    text = "Hello   \nWorld"

    assert normalize_text(text) == "Hello\nWorld"


def test_count_words():
    text = "This is a simple document."

    assert count_words(text) == 5


def test_count_hyphenated_words():
    text = "This is an end-to-end test."

    assert count_words(text) == 5


def test_empty_text():
    assert normalize_text("") == ""
    assert count_words("") == 0