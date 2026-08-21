import fitz

from app.services.pdf_extractor import extract_pdf_text


def test_extract_pdf_text(tmp_path):
    pdf_path = tmp_path / "sample.pdf"

    document = fitz.open()

    page = document.new_page()

    page.insert_text(
        (72, 72),
        "Document Summary Assistant test document.",
    )

    document.save(pdf_path)
    document.close()

    text, pages = extract_pdf_text(pdf_path)

    assert pages == 1
    assert "Document Summary Assistant" in text