import os
import json
import re
import uuid
import logging
from collections import Counter

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pypdf import PdfReader
import io

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

import google.generativeai as genai

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Resume ATS Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ───────────────────────────────────────────────────────────────────

_STOPWORDS = {
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "is","are","was","were","be","been","have","has","had","do","does","did",
    "will","would","could","should","may","might","must","shall","can","need",
    "that","this","these","those","it","its","we","you","your","our","their",
    "from","by","as","if","so","not","no","nor","yet","both","either","about",
    "above","after","before","between","into","through","during","including",
    "without","within","along","following","across","behind","beyond","plus",
    "except","up","out","around","down","off","over","under","again","further",
    "then","once","more","also","just","than","other","such","any","all","each",
    "how","what","when","where","who","which","while","per","etc","ie","eg",
}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    return "".join(page.extract_text() or "" for page in reader.pages).strip()


def extract_skills(text: str, model) -> set:
    prompt = (
        "Extract specific technical skills, tools, programming languages, frameworks, "
        "and technologies from the following text.\n"
        "Be specific — instead of 'backend development' return 'python', 'node.js', 'django' etc.\n"
        "Return ONLY valid JSON like: {\"skills\": [\"python\", \"react\", \"sql\"]}\n"
        "No broad categories, no extra commentary, no markdown fences.\n\n"
        f"Text:\n{text}"
    )
    response = model.generate_content(prompt)
    cleaned = response.text.strip().replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(cleaned)
        return {skill.lower().strip() for skill in parsed.get("skills", []) if isinstance(skill, str)}
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Could not parse skills JSON: %s", e)
        return set()


def get_youtube_roadmap(missing_skills: list, model) -> dict:
    if not missing_skills:
        return {}

    skills_str = ", ".join(missing_skills[:8])

    prompt = f"""
You are an expert career coach and learning advisor.

The user is missing these technical skills required for their target job:
{skills_str}

For EACH skill, suggest the TOP YouTube courses/channels across 3 learning stages.
Use ONLY real, well-known YouTube channels and creators that actually exist and cover these topics.

Return ONLY valid JSON in this exact format (no markdown, no extra text):

{{
  "roadmap": [
    {{
      "skill": "skill_name",
      "why_important": "1 sentence on why this skill matters for the job",
      "beginner": [
        {{
          "title": "Course or video series title",
          "channel": "YouTube channel name",
          "search_query": "exact search term to find it on YouTube",
          "duration": "estimated time to complete e.g. 4 hours",
          "what_you_learn": "brief description"
        }}
      ],
      "intermediate": [
        {{
          "title": "Course or video series title",
          "channel": "YouTube channel name",
          "search_query": "exact search term to find it on YouTube",
          "duration": "estimated time to complete",
          "what_you_learn": "brief description"
        }}
      ],
      "expert": [
        {{
          "title": "Course or video series title",
          "channel": "YouTube channel name",
          "search_query": "exact search term to find it on YouTube",
          "duration": "estimated time to complete",
          "what_you_learn": "brief description"
        }}
      ]
    }}
  ]
}}

Rules:
- Only use real YouTube channels (e.g. freeCodeCamp, Traversy Media, Fireship, TechWorld with Nana, Corey Schafer, etc.)
- search_query must be a real searchable YouTube query
- beginner = fundamentals and syntax
- intermediate = projects, real-world usage
- expert = advanced patterns, system design, production-level usage
- Provide 1-2 items per stage per skill
- Keep what_you_learn under 15 words
"""

    response = model.generate_content(prompt)
    cleaned = response.text.strip().replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(cleaned)
        return {item["skill"]: item for item in data.get("roadmap", [])}
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Could not parse roadmap JSON: %s", e)
        return {}


def ats_score(resume_text: str, jd_text: str) -> tuple[float, float]:
    resume_words = re.findall(r"\w+", resume_text.lower())
    jd_words     = re.findall(r"\w+", jd_text.lower())
    resume_count = Counter(resume_words)
    jd_keywords  = {w for w in set(jd_words) if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()}
    if not jd_keywords:
        return 0.0, 0.0
    matched_keywords = sum(1 for kw in jd_keywords if resume_count[kw] > 0)
    stuffing_penalty = sum(resume_count[kw] - 10 for kw in jd_keywords if resume_count[kw] > 10)
    keyword_density  = matched_keywords / len(jd_keywords)
    final            = max(0.0, keyword_density - stuffing_penalty * 0.001)
    return round(final * 100, 2), round(keyword_density * 100, 2)


def build_chroma(text: str, embeddings) -> Chroma:
    splitter  = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    documents = splitter.create_documents([text])
    return Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        collection_name=f"resume_{uuid.uuid4().hex}"
    )


def semantic_match_score(resume_store: Chroma, jd_text: str) -> float:
    results = resume_store.similarity_search_with_score(jd_text, k=5)
    if not results:
        return 0.0
    avg_distance = sum(score for _, score in results) / len(results)
    return round(1 / (1 + avg_distance) * 100, 2)


def get_debug_info(resume_text: str, jd_text: str) -> dict:
    resume_words = re.findall(r"\w+", resume_text.lower())
    jd_words     = re.findall(r"\w+", jd_text.lower())
    resume_count = Counter(resume_words)
    jd_keywords  = {w for w in set(jd_words) if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()}
    matched      = {kw for kw in jd_keywords if resume_count[kw] > 0}
    return {
        "jd_keywords":     sorted(jd_keywords),
        "matched":         sorted(matched),
        "not_matched":     sorted(jd_keywords - matched),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def root():
    with open("index.html") as f:
        return f.read()


@app.post("/analyze")
async def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not set in environment.")

    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    # Read PDF
    file_bytes = await resume.read()
    resume_text = extract_text_from_pdf(file_bytes)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

    # Truncate
    resume_text = resume_text[:15000]
    jd_text     = job_description.strip()[:10000]

    # JD quality check
    jd_keyword_count = len({
        w for w in set(re.findall(r"\w+", jd_text.lower()))
        if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()
    })
    warnings = []
    if jd_keyword_count < 15:
        warnings.append(f"Your JD only has {jd_keyword_count} keywords — ATS scores may be unreliable.")

    # Init Gemini
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel("gemini-2.5-flash")
    embeddings   = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001", google_api_key=api_key)

    # Scores
    resume_store        = build_chroma(resume_text, embeddings)
    sem_score           = semantic_match_score(resume_store, jd_text)
    ats_final, kw_density = ats_score(resume_text, jd_text)

    # Skills
    resume_skills = extract_skills(resume_text, gemini_model)
    jd_skills     = extract_skills(jd_text, gemini_model)
    missing_skills = sorted(jd_skills - resume_skills)

    # Roadmap
    roadmap = get_youtube_roadmap(missing_skills, gemini_model) if missing_skills else {}

    # Debug
    debug = get_debug_info(resume_text, jd_text)

    return {
        "warnings":        warnings,
        "semantic_score":  sem_score,
        "ats_score":       ats_final,
        "keyword_density": kw_density,
        "resume_skills":   sorted(resume_skills),
        "jd_skills":       sorted(jd_skills),
        "missing_skills":  missing_skills,
        "roadmap":         roadmap,
        "debug":           debug,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}