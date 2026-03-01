import os
import json
import re
import uuid
import logging
from collections import Counter
import io

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from pypdf import PdfReader

# ── Latest LangChain imports ──────────────────────────────────────────────────
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma  # ✅ Use underscore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document               # NEW: langchain-core

# ── New Gemini SDK ────────────────────────────────────────────────────────────
from google import genai

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Resume ATS Analyzer", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Init Gemini ───────────────────────────────────────────────────────────────
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("GOOGLE_API_KEY not found in .env file.")

client      = genai.Client(api_key=api_key)
GEMINI_MODEL = "gemini-2.5-flash"


# ── Stopwords ─────────────────────────────────────────────────────────────────
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


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def gemini(prompt: str) -> str:
    """Single Gemini call using new google-genai SDK."""
    response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    return "".join(page.extract_text() or "" for page in reader.pages).strip()


def extract_skills(text: str) -> set:
    prompt = (
        "Extract specific technical skills, tools, programming languages, frameworks, "
        "and technologies from the following text.\n"
        "Be specific — return 'python' not 'programming'.\n"
        "Return ONLY valid JSON: {\"skills\": [\"python\", \"react\", \"sql\"]}\n"
        "No broad categories, no markdown fences.\n\n"
        f"Text:\n{text}"
    )
    text_out = gemini(prompt)
    cleaned  = text_out.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(cleaned)
        return {s.lower().strip() for s in parsed.get("skills", []) if isinstance(s, str)}
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Skills parse error: %s", e)
        return set()


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
    """Build an in-memory Chroma vector store using latest langchain-chroma."""
    splitter  = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    # Use langchain_core.documents.Document directly
    chunks    = splitter.split_text(text)
    documents = [Document(page_content=chunk) for chunk in chunks]
    return Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        collection_name=f"resume_{uuid.uuid4().hex}",
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
        "jd_keywords":  sorted(jd_keywords),
        "matched":      sorted(matched),
        "not_matched":  sorted(jd_keywords - matched),
    }


# ── Candidate: Learning Roadmap ───────────────────────────────────────────────

def get_learning_roadmap(missing_skills: list, existing_skills: list) -> dict:
    if not missing_skills:
        return {}

    skills_str   = ", ".join(missing_skills[:8])
    existing_str = ", ".join(existing_skills[:15])

    prompt = f"""
You are a senior career coach and technical learning advisor.

The candidate already knows: {existing_str}
They are missing these skills required for their target job: {skills_str}

Create a REALISTIC, DETAILED learning roadmap for each missing skill.
Use the candidate's existing knowledge to skip basics they likely already know.
Assume 2 hours of focused study per day.

Return ONLY valid JSON (no markdown, no extra text):

{{
  "overall": {{
    "total_days": 75,
    "total_weeks": 11,
    "hours_per_day": 2,
    "difficulty": "Moderate",
    "summary": "One motivating sentence summarizing this learning journey",
    "recommended_order": ["skill1", "skill2", "skill3"],
    "quick_wins": ["skills learnable in under 2 weeks"]
  }},
  "skills": [
    {{
      "skill": "skill_name",
      "why_important": "1 sentence why this skill matters for the job",
      "priority": "critical",
      "difficulty": "moderate",
      "time_estimate": {{
        "beginner_days": 10,
        "intermediate_days": 15,
        "expert_days": 20,
        "total_days": 45,
        "time_note": "Assuming 2 hrs/day of focused practice"
      }},
      "approach": [
        {{"step": 1, "action": "Start with official docs + beginner tutorial", "duration": "Days 1-10"}},
        {{"step": 2, "action": "Build 2-3 small projects end-to-end", "duration": "Days 11-25"}},
        {{"step": 3, "action": "Apply to production patterns and interview prep", "duration": "Days 26-45"}}
      ],
      "phases": [
        {{"phase": "beginner", "days": "Days 1-10", "daily_focus": "Core syntax and basic usage", "daily_goal": "Follow a structured tutorial and replicate examples", "phase_outcome": "Can write basic programs from scratch"}},
        {{"phase": "intermediate", "days": "Days 11-25", "daily_focus": "Real-world projects", "daily_goal": "Build a small project each week", "phase_outcome": "Can build and explain a working project"}},
        {{"phase": "expert", "days": "Days 26-45", "daily_focus": "Advanced patterns and production usage", "daily_goal": "Study production codebases and practice interview Q&A", "phase_outcome": "Job-ready: can architect and implement professionally"}}
      ],
      "milestones": [
        "Can write a basic program without looking up syntax",
        "Built and deployed a small project",
        "Can explain architecture and tradeoffs in an interview",
        "Optimized or debugged a real-world usage"
      ],
      "tips": {{
        "do": ["Code along with tutorials — don't just watch", "Build something personally meaningful"],
        "dont": ["Don't read docs without practicing alongside", "Don't skip the beginner phase"]
      }},
      "courses": {{
        "beginner": [{{"title": "Course title", "channel": "Real YouTube channel", "search_query": "searchable YouTube query", "duration": "4 hours", "what_you_learn": "brief description under 15 words"}}],
        "intermediate": [{{"title": "Course title", "channel": "Real YouTube channel", "search_query": "searchable YouTube query", "duration": "6 hours", "what_you_learn": "brief description under 15 words"}}],
        "expert": [{{"title": "Course title", "channel": "Real YouTube channel", "search_query": "searchable YouTube query", "duration": "8 hours", "what_you_learn": "brief description under 15 words"}}]
      }}
    }}
  ]
}}

Rules:
- Be REALISTIC with time estimates — a new framework takes 3-6 weeks minimum
- priority: critical | high | medium | low
- difficulty: easy | moderate | hard | very hard
- Use ONLY real YouTube channels: freeCodeCamp, Traversy Media, Fireship, TechWorld with Nana, Corey Schafer, etc.
- search_query must be directly searchable on YouTube
- 1-2 courses per stage per skill
- quick_wins = skills learnable under 2 weeks given existing background
- milestones must be concrete and self-verifiable
"""
    text    = gemini(prompt)
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Roadmap parse error: %s", e)
        return {}


# ── Recruiter Analysis ────────────────────────────────────────────────────────

def run_recruiter_analysis(
    resume_text: str, jd_text: str,
    resume_skills: set, jd_skills: set,
    sem_score: float, ats_final: float
) -> dict:
    matched   = resume_skills & jd_skills
    missing   = jd_skills - resume_skills
    match_pct = round(len(matched) / len(jd_skills) * 100, 1) if jd_skills else 0

    rule_flags = []
    if len(resume_text) < 500:
        rule_flags.append("Resume is very short — may lack detail")
    if match_pct < 30:
        rule_flags.append(f"Only {match_pct}% skill overlap with JD requirements")
    if ats_final < 40:
        rule_flags.append("Low ATS keyword score — resume may not pass automated screening")
    if sem_score < 40:
        rule_flags.append("Low semantic match — resume content doesn't align well with JD")

    prompt = f"""
You are a senior technical recruiter evaluating a candidate for a job role.

CANDIDATE DATA:
- Resume skills: {sorted(resume_skills)}
- JD required skills: {sorted(jd_skills)}
- Matched skills: {sorted(matched)}
- Missing skills: {sorted(missing)}
- Skill match: {match_pct}%
- Semantic match score: {sem_score}/100
- ATS keyword score: {ats_final}/100
- Pre-analysis flags: {rule_flags}

Resume excerpt: {resume_text[:3000]}
Job Description: {jd_text[:2000]}

Return ONLY valid JSON (no markdown):
{{
  "verdict": "Strong Hire | Good Candidate | Maybe | Needs Improvement | Reject",
  "verdict_reason": "1-2 sentence justification",
  "overall_score": 82,
  "scores": {{
    "skill_match": 85,
    "experience_relevance": 78,
    "communication_clarity": 80,
    "technical_depth": 75,
    "culture_fit_indicators": 70
  }},
  "candidate_summary": "3-4 sentence recruiter summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "red_flags": ["flag 1", "flag 2"],
  "skill_match_breakdown": {{
    "matched": ["skill1"],
    "missing_critical": ["skill2"],
    "missing_nice_to_have": ["skill3"],
    "bonus_skills": ["skill4"]
  }},
  "interview_questions": [{{"question": "...", "reason": "why ask this"}}],
  "hiring_recommendation": "2-3 sentence recommendation",
  "salary_band_fit": "entry | mid | senior | lead"
}}
"""
    text    = gemini(prompt)
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        result = json.loads(cleaned)
        result["_meta"] = {
            "sem_score": sem_score,
            "ats_score": ats_final,
            "match_pct": match_pct,
            "rule_flags": rule_flags,
        }
        return result
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Recruiter analysis parse error: %s", e)
        return {}


# ── Shared Pipeline ───────────────────────────────────────────────────────────

async def run_shared_pipeline(file_bytes: bytes, jd_text: str) -> dict:
    resume_text = extract_text_from_pdf(file_bytes)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

    resume_text = resume_text[:15000]
    jd_text     = jd_text.strip()[:10000]

    warnings = []
    jd_keyword_count = len({
        w for w in set(re.findall(r"\w+", jd_text.lower()))
        if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()
    })
    if jd_keyword_count < 15:
        warnings.append(f"JD only has {jd_keyword_count} keywords — scores may be unreliable.")

    # Embeddings — latest langchain-google-genai
    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",  # ✅ Use this instead
        google_api_key=api_key,
    )

    resume_store = build_chroma(resume_text, embeddings)
    sem_score    = semantic_match_score(resume_store, jd_text)
    ats_final, kw_density = ats_score(resume_text, jd_text)

    resume_skills = extract_skills(resume_text)
    jd_skills     = extract_skills(jd_text)

    return {
        "resume_text":   resume_text,
        "jd_text":       jd_text,
        "sem_score":     sem_score,
        "ats_final":     ats_final,
        "kw_density":    kw_density,
        "resume_skills": resume_skills,
        "jd_skills":     jd_skills,
        "warnings":      warnings,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
async def root():
    with open("index.html") as f:
        return f.read()


@app.post("/analyze/candidate")
async def analyze_candidate(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    """
    Candidate mode — returns ATS scores, skill gaps, and full learning roadmap.

    Form fields:
      resume          : PDF file
      job_description : string

    Response:
    {
      "warnings": [],
      "semantic_score": 72.5,
      "ats_score": 65.3,
      "keyword_density": 66.7,
      "resume_skills": [...],
      "jd_skills": [...],
      "missing_skills": [...],
      "roadmap": { "overall": {...}, "skills": [...] },
      "debug": { "jd_keywords": [...], "matched": [...], "not_matched": [...] }
    }
    """
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    file_bytes = await resume.read()
    data       = await run_shared_pipeline(file_bytes, job_description)

    resume_skills  = data["resume_skills"]
    jd_skills      = data["jd_skills"]
    missing_skills = sorted(jd_skills - resume_skills)

    roadmap = get_learning_roadmap(missing_skills, list(resume_skills)) if missing_skills else {}
    debug   = get_debug_info(data["resume_text"], data["jd_text"])

    return {
        "warnings":        data["warnings"],
        "semantic_score":  data["sem_score"],
        "ats_score":       data["ats_final"],
        "keyword_density": data["kw_density"],
        "resume_skills":   sorted(resume_skills),
        "jd_skills":       sorted(jd_skills),
        "missing_skills":  missing_skills,
        "roadmap":         roadmap,
        "debug":           debug,
    }


@app.post("/analyze/recruiter")
async def analyze_recruiter(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    """
    Recruiter mode — returns hiring verdict, scorecard, red flags, interview questions.

    Form fields:
      resume          : PDF file
      job_description : string

    Response:
    {
      "warnings": [],
      "semantic_score": 72.5,
      "ats_score": 65.3,
      "keyword_density": 66.7,
      "resume_skills": [...],
      "jd_skills": [...],
      "report": {
        "verdict": "Good Candidate",
        "verdict_reason": "...",
        "overall_score": 78,
        "scores": {...},
        "candidate_summary": "...",
        "strengths": [...],
        "red_flags": [...],
        "skill_match_breakdown": {...},
        "interview_questions": [...],
        "hiring_recommendation": "...",
        "salary_band_fit": "senior",
        "_meta": { "sem_score": ..., "ats_score": ..., "match_pct": ..., "rule_flags": [...] }
      }
    }
    """
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    file_bytes = await resume.read()
    data       = await run_shared_pipeline(file_bytes, job_description)

    report = run_recruiter_analysis(
        data["resume_text"], data["jd_text"],
        data["resume_skills"], data["jd_skills"],
        data["sem_score"], data["ats_final"],
    )
    if not report:
        raise HTTPException(status_code=500, detail="Recruiter analysis failed. Please try again.")

    return {
        "warnings":        data["warnings"],
        "semantic_score":  data["sem_score"],
        "ats_score":       data["ats_final"],
        "keyword_density": data["kw_density"],
        "resume_skills":   sorted(data["resume_skills"]),
        "jd_skills":       sorted(data["jd_skills"]),
        "report":          report,
    }