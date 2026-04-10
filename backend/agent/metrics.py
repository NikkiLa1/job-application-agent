import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize


def compute_match_score(resume_text: str, job_text: str) -> dict:
    """
    Compute keyword overlap between resume and job description.
    Returns score (0-100), matched keywords, and missing keywords.
    """
    try:
        stop_words = set(stopwords.words("english"))
    except LookupError:
        nltk.download("stopwords", quiet=True)
        stop_words = set(stopwords.words("english"))

    def extract_keywords(text: str) -> set:
        try:
            tokens = word_tokenize(text.lower())
        except LookupError:
            nltk.download("punkt", quiet=True)
            nltk.download("punkt_tab", quiet=True)
            tokens = word_tokenize(text.lower())
        return {
            t for t in tokens if t.isalpha() and t not in stop_words and len(t) > 2
        }

    job_keywords = extract_keywords(job_text)
    resume_keywords = extract_keywords(resume_text)

    if not job_keywords:
        return {"score": 0.0, "matched": [], "missing": []}

    matched = job_keywords & resume_keywords
    missing = job_keywords - resume_keywords
    score = round((len(matched) / len(job_keywords)) * 100, 1)

    return {
        "score": score,
        "matched": sorted(matched)[:50],
        "missing": sorted(missing)[:50],
    }
