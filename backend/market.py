import os
import json
import logging
import io

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from pypdf import PdfReader
from google import genai

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Market Trend Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Init Gemini (new SDK) ─────────────────────────────────────────────────────
api_key = os.getenv("MARKET_API_KEY")
if not api_key:
    raise RuntimeError("MARKET_API_KEY not found in .env file.")

client = genai.Client(api_key=api_key)
GEMINI_MODEL = "gemini-2.5-flash"


# ── Helpers ───────────────────────────────────────────────────────────────────

def gemini(prompt: str) -> str:
    response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    return "".join(page.extract_text() or "" for page in reader.pages).strip()


def extract_skills(resume_text: str) -> list:
    prompt = (
        "Extract all specific technical skills, tools, programming languages, "
        "frameworks and technologies from this resume.\n"
        "Be specific — return 'python' not 'programming'.\n"
        "Return ONLY valid JSON: {\"skills\": [\"python\", \"sql\", \"react\"]}\n"
        "No broad categories, no markdown fences.\n\n"
        f"Resume:\n{resume_text[:8000]}"
    )
    text    = gemini(prompt)
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned).get("skills", [])
    except (json.JSONDecodeError, KeyError):
        return []


def analyze_market(resume_skills: list) -> dict:
    skills_str = ", ".join(resume_skills)
    prompt = f"""
You are a senior job market analyst with deep knowledge of current tech hiring trends (2024-2025).

The candidate has these skills from their resume:
{skills_str}

Perform a complete market analysis and return ONLY valid JSON (no markdown, no extra text):

{{
  "skill_demand": [
    {{
      "skill": "python",
      "demand_score": 95,
      "trend": "rising",
      "level": "high",
      "market_comment": "one line insight about this skill's market value"
    }}
  ],

  "trending_skills": [
    {{
      "skill": "skill name",
      "demand_score": 90,
      "why_trending": "brief reason"
    }}
  ],

  "skill_gaps": [
    {{
      "skill": "missing skill name",
      "demand_score": 85,
      "why_needed": "brief reason"
    }}
  ],

  "job_matches": [
    {{
      "title": "Job Title",
      "match_pct": 82,
      "required_skills": ["skill1", "skill2", "skill3"],
      "missing_skills": ["skill4"],
      "avg_salary_usd": "120000-150000"
    }}
  ],

  "salary_insights": {{
    "current_estimated_range": "$X - $Y",
    "potential_range_with_upskilling": "$A - $B",
    "currency": "USD",
    "market_summary": "2-3 sentence salary analysis",
    "by_role": [
      {{
        "role": "role name",
        "min": "$X",
        "avg": "$Y",
        "max": "$Z"
      }}
    ]
  }},

  "learning_path": [
    {{
      "skill": "skill to learn",
      "priority": "high",
      "estimated_time": "4 weeks",
      "salary_impact": "+$10,000/yr",
      "resource": "YouTube channel or course name"
    }}
  ],

  "market_summary": "3-4 sentence overall assessment of the candidate's market position"
}}

Rules:
- demand_score: 0-100 based on real 2024-2025 job market data
- trend: one of rising / stable / declining
- level: one of high / medium / low
- match_pct: realistic percentage based on skill overlap
- List top 8 job matches
- List top 8 trending skills in current market
- List top 6 skill gaps most impactful for career growth
- List top 6 learning path items ordered by priority
- salary_insights.by_role: include top 5 matched roles
- Be realistic and data-driven, not overly optimistic
"""
    text    = gemini(prompt)
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Market analysis parse error: %s", e)
        return {}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
async def root():
    with open("index.html") as f:
        return f.read()


@app.post("/analyze")
async def analyze(resume: UploadFile = File(...)):
    """
    Upload a resume PDF and get full market analysis.

    Returns:
    {
        "skills": [...],
        "skill_demand": [...],
        "trending_skills": [...],
        "skill_gaps": [...],
        "job_matches": [...],
        "salary_insights": {...},
        "learning_path": [...],
        "market_summary": "..."
    }
    """
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await resume.read()

    # Step 1 — Extract text
    resume_text = extract_text_from_pdf(file_bytes)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

    # Step 2 — Extract skills
    skills = extract_skills(resume_text)
    if not skills:
        raise HTTPException(status_code=422, detail="Could not extract skills from the resume.")

    # Step 3 — Full market analysis
    data = analyze_market(skills)
    if not data:
        raise HTTPException(status_code=500, detail="Market analysis failed. Please try again.")

    data["skills"] = skills
    return data