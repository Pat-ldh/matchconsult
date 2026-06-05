import re
from pathlib import Path

import pdfplumber
from docx import Document


def extract_text_from_pdf(path: str) -> str:
    parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
    return "\n".join(parts)


def extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(path: str) -> str:
    ext = Path(path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(path)
    if ext in (".docx", ".doc"):
        return extract_text_from_docx(path)
    return ""


def name_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    name = re.sub(r"[_\-\.]", " ", stem)
    return " ".join(w.capitalize() for w in name.split())


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc"}
