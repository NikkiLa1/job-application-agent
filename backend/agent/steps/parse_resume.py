import fitz  # PyMuPDF


def parse_resume(context: dict) -> None:
    """Extract plain text from the uploaded PDF resume."""
    doc = fitz.open(stream=context["resume_bytes"], filetype="pdf")
    pages = [page.get_text() for page in doc]
    doc.close()
    context["resume_text"] = "\n".join(pages).strip()
