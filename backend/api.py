import os
import io
import json
import re
import math
import logging
from collections import Counter
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
import httpx

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _load_key(env_var: str) -> str:
    key = os.getenv(env_var)
    if not key:
        raise RuntimeError(f"{env_var} not found in .env file.")
    return key

# ── Single xAI client replaces all 4 Gemini clients ──────────────────────────
GROK_MODEL = "grok-4-1-fast-reasoning"

client = OpenAI(
    api_key=_load_key("XAI_API_KEY"),
    base_url="https://api.x.ai/v1",
    timeout=httpx.Timeout(3600.0),  # required for reasoning models
)

# ── NOTE on Embeddings ────────────────────────────────────────────────────────
# xAI has no embeddings endpoint yet.
# ATS semantic score now uses TF-IDF cosine similarity (zero extra API calls).
# Accuracy is slightly lower than neural embeddings but perfectly adequate for
# keyword-heavy resume/JD matching. All other behaviour is identical.

app = FastAPI(
    title="🚀 Unified AI Career Platform",
    description="All-in-one AI career assistant powered by Grok-4-1-Fast-Reasoning",
    version="5.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# ── Core helper ───────────────────────────────────────────────────────────────
def grok_text(system_prompt: str, user_prompt: str, max_tokens: int = 4096) -> str:
    """Single Grok call used by every module."""
    response = client.chat.completions.create(
        model=GROK_MODEL,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    )
    return response.choices[0].message.content.strip()

def parse_json(raw: str) -> dict | list:
    cleaned = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    return "".join(page.extract_text() or "" for page in reader.pages).strip()


# ═════════════════════════════════════════════════════════════════════════════
#  MODULE 1 — CHAT
# ═════════════════════════════════════════════════════════════════════════════
class ChatMessage(BaseModel):
    role: str = Field(..., examples=["user"])
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default=[])

class ChatResponse(BaseModel):
    reply: str

chat_tag = ["💬 Chat"]

@app.post("/chat/message", response_model=ChatResponse, tags=chat_tag,
          summary="Send a message to the AI assistant")
async def chat_message(req: ChatRequest):
    try:
        messages = [{"role": "system", "content": "You are a helpful AI career assistant. Answer clearly and concisely."}]
        for msg in req.history:
            messages.append({"role": "user" if msg.role == "user" else "assistant", "content": msg.text})
        messages.append({"role": "user", "content": req.message})

        response = client.chat.completions.create(model=GROK_MODEL, max_tokens=2048, messages=messages)
        return ChatResponse(reply=response.choices[0].message.content or "No response generated.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═════════════════════════════════════════════════════════════════════════════
#  MODULE 2 — MARKET TREND ANALYZER
# ═════════════════════════════════════════════════════════════════════════════
def market_extract_skills(resume_text: str) -> list[str]:
    system = "You are a precise skill extractor. Return ONLY valid JSON, no markdown."
    user = (
        "Extract all specific technical skills, tools, programming languages, frameworks "
        "and technologies from this resume. Be specific — return 'python' not 'programming'.\n"
        "Return ONLY: {\"skills\": [\"python\", \"sql\", \"react\"]}\n\n"
        f"Resume:\n{resume_text[:8000]}"
    )
    try:
        return parse_json(grok_text(system, user, max_tokens=1024)).get("skills", [])
    except Exception:
        return []

def market_analyze(resume_skills: list[str]) -> dict:
    system = "You are a senior job market analyst. Return ONLY valid JSON, no markdown."
    user = f"""
The candidate has these skills: {", ".join(resume_skills)}
Perform a complete market analysis for 2024-2025. Return ONLY valid JSON:
{{
  "skill_demand": [
    {{"skill":"python","demand_score":95,"trend":"rising","level":"high","market_comment":"one line insight"}}
  ],
  "trending_skills": [
    {{"skill":"skill name","demand_score":90,"why_trending":"brief reason"}}
  ],
  "skill_gaps": [
    {{"skill":"missing skill","demand_score":85,"why_needed":"brief reason"}}
  ],
  "job_matches": [
    {{"title":"Job Title","match_pct":82,"required_skills":["s1","s2"],"missing_skills":["s3"],"avg_salary_usd":"120000-150000"}}
  ],
  "salary_insights": {{
    "current_estimated_range":"$X-$Y",
    "potential_range_with_upskilling":"$A-$B",
    "currency":"USD",
    "market_summary":"2-3 sentence salary analysis",
    "by_role":[{{"role":"name","min":"$X","avg":"$Y","max":"$Z"}}]
  }},
  "learning_path": [
    {{"skill":"skill to learn","priority":"high","estimated_time":"4 weeks","salary_impact":"+$10,000/yr","resource":"YouTube channel or course"}}
  ],
  "market_summary":"3-4 sentence overall assessment"
}}
Rules: demand_score 0-100 | trend: rising/stable/declining | level: high/medium/low
Top 8 job matches, top 8 trending skills, top 6 skill gaps, top 6 learning path items.
"""
    try:
        return parse_json(grok_text(system, user, max_tokens=4096))
    except Exception as e:
        logger.warning("Market analysis parse error: %s", e)
        return {}

market_tag = ["📈 Market Trend Analyzer"]

@app.post("/market/analyze", tags=market_tag, summary="Analyze job market from resume PDF")
async def market_analyze_route(resume: UploadFile = File(..., description="Resume PDF file")):
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    file_bytes  = await resume.read()
    resume_text = extract_text_from_pdf(file_bytes)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
    skills = market_extract_skills(resume_text)
    if not skills:
        raise HTTPException(status_code=422, detail="Could not extract skills from the resume.")
    data = market_analyze(skills)
    if not data:
        raise HTTPException(status_code=500, detail="Market analysis failed. Please try again.")
    data["skills"] = skills
    return data


# ═════════════════════════════════════════════════════════════════════════════
#  MODULE 3 — ATS RESUME ANALYZER
# ═════════════════════════════════════════════════════════════════════════════

# TF-IDF cosine similarity replaces Gemini embedding API (xAI has no embeddings endpoint)
def _tfidf_vector(text: str, vocab: set[str]) -> dict[str, float]:
    words  = re.findall(r"\w+", text.lower())
    counts = Counter(w for w in words if w in vocab)
    total  = sum(counts.values()) or 1
    return {w: c / total for w, c in counts.items()}

def _cosine(a: dict, b: dict) -> float:
    keys  = set(a) | set(b)
    dot   = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    mag_a = math.sqrt(sum(v * v for v in a.values()))
    mag_b = math.sqrt(sum(v * v for v in b.values()))
    return 0.0 if (mag_a == 0 or mag_b == 0) else dot / (mag_a * mag_b)

def ats_semantic_score(resume_text: str, jd_text: str) -> float:
    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
    chunks   = splitter.split_text(resume_text)
    if not chunks:
        return 0.0
    all_words = re.findall(r"\w+", (resume_text + " " + jd_text).lower())
    vocab     = {w for w in all_words if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()}
    jd_vec     = _tfidf_vector(jd_text, vocab)
    chunk_vecs = [_tfidf_vector(c, vocab) for c in chunks[:12]]
    sims       = sorted([_cosine(cv, jd_vec) for cv in chunk_vecs], reverse=True)
    avg        = sum(sims[:5]) / min(5, len(sims))
    return round(avg * 100, 2)

def ats_keyword_score(resume_text: str, jd_text: str) -> tuple[float, float]:
    resume_count     = Counter(re.findall(r"\w+", resume_text.lower()))
    jd_keywords      = {w for w in set(re.findall(r"\w+", jd_text.lower()))
                        if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()}
    if not jd_keywords:
        return 0.0, 0.0
    matched          = sum(1 for kw in jd_keywords if resume_count[kw] > 0)
    stuffing_penalty = sum(resume_count[kw] - 10 for kw in jd_keywords if resume_count[kw] > 10)
    kw_density       = matched / len(jd_keywords)
    final            = max(0.0, kw_density - stuffing_penalty * 0.001)
    return round(final * 100, 2), round(kw_density * 100, 2)

def ats_extract_skills(text: str) -> set[str]:
    system = "You are a precise skill extractor. Return ONLY valid JSON, no markdown."
    user = (
        "Extract specific technical skills, tools, programming languages, frameworks "
        "and technologies from this text.\n"
        "Return ONLY: {\"skills\": [\"python\", \"react\", \"sql\"]}\n\n"
        f"Text:\n{text}"
    )
    try:
        parsed = parse_json(grok_text(system, user, max_tokens=1024))
        return {s.lower().strip() for s in parsed.get("skills", []) if isinstance(s, str)}
    except Exception as e:
        logger.warning("Skills parse error: %s", e)
        return set()

def ats_debug_info(resume_text: str, jd_text: str) -> dict:
    resume_count = Counter(re.findall(r"\w+", resume_text.lower()))
    jd_keywords  = {w for w in set(re.findall(r"\w+", jd_text.lower()))
                    if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()}
    matched      = {kw for kw in jd_keywords if resume_count[kw] > 0}
    return {"jd_keywords": sorted(jd_keywords), "matched": sorted(matched), "not_matched": sorted(jd_keywords - matched)}

def ats_learning_roadmap(missing_skills: list[str], existing_skills: list[str]) -> dict:
    if not missing_skills:
        return {}
    system = "You are a senior career coach. Return ONLY valid JSON, no markdown."
    user = f"""
The candidate knows: {", ".join(existing_skills[:15])}
They are missing: {", ".join(missing_skills[:8])}
Assume 2 hours/day of study.

Return ONLY valid JSON:
{{
  "overall": {{
    "total_days":75,"total_weeks":11,"hours_per_day":2,"difficulty":"Moderate",
    "summary":"One motivating sentence","recommended_order":["skill1","skill2"],"quick_wins":["skills under 2 weeks"]
  }},
  "skills": [
    {{
      "skill":"skill_name","why_important":"1 sentence","priority":"critical","difficulty":"moderate",
      "time_estimate":{{"beginner_days":10,"intermediate_days":15,"expert_days":20,"total_days":45,"time_note":"2 hrs/day"}},
      "approach":[
        {{"step":1,"action":"Docs + beginner tutorial","duration":"Days 1-10"}},
        {{"step":2,"action":"Build 2-3 small projects","duration":"Days 11-25"}},
        {{"step":3,"action":"Production patterns + interview prep","duration":"Days 26-45"}}
      ],
      "phases":[
        {{"phase":"beginner","days":"Days 1-10","daily_focus":"Core syntax","daily_goal":"Follow tutorial","phase_outcome":"Write basic programs"}},
        {{"phase":"intermediate","days":"Days 11-25","daily_focus":"Real projects","daily_goal":"Build weekly project","phase_outcome":"Working project"}},
        {{"phase":"expert","days":"Days 26-45","daily_focus":"Advanced patterns","daily_goal":"Production codebases","phase_outcome":"Job-ready"}}
      ],
      "milestones":["Write without syntax lookup","Deploy a project","Explain architecture","Debug real usage"],
      "tips":{{"do":["Code along tutorials","Build meaningful projects"],"dont":["Read without coding","Skip beginner phase"]}},
      "courses":{{
        "beginner":[{{"title":"Title","channel":"freeCodeCamp","search_query":"YouTube query","duration":"4 hours","what_you_learn":"Brief description"}}],
        "intermediate":[{{"title":"Title","channel":"Traversy Media","search_query":"YouTube query","duration":"6 hours","what_you_learn":"Brief description"}}],
        "expert":[{{"title":"Title","channel":"Fireship","search_query":"YouTube query","duration":"8 hours","what_you_learn":"Brief description"}}]
      }}
    }}
  ]
}}
Rules: priority: critical|high|medium|low | difficulty: easy|moderate|hard|very hard
Use real YouTube channels. 1-2 courses per stage.
"""
    try:
        return parse_json(grok_text(system, user, max_tokens=6000))
    except Exception as e:
        logger.warning("Roadmap parse error: %s", e)
        return {}

def ats_recruiter_analysis(resume_text, jd_text, resume_skills, jd_skills, sem_score, ats_final) -> dict:
    matched   = resume_skills & jd_skills
    missing   = jd_skills - resume_skills
    match_pct = round(len(matched) / len(jd_skills) * 100, 1) if jd_skills else 0
    rule_flags = []
    if len(resume_text) < 500: rule_flags.append("Resume is very short — may lack detail")
    if match_pct < 30:         rule_flags.append(f"Only {match_pct}% skill overlap with JD")
    if ats_final < 40:         rule_flags.append("Low ATS score — may not pass automated screening")
    if sem_score < 40:         rule_flags.append("Low semantic match — content doesn't align with JD")

    system = "You are a senior technical recruiter. Return ONLY valid JSON, no markdown."
    user = f"""
Resume skills: {sorted(resume_skills)} | JD required: {sorted(jd_skills)}
Matched: {sorted(matched)} | Missing: {sorted(missing)}
Skill match: {match_pct}% | Semantic: {sem_score}/100 | ATS: {ats_final}/100
Flags: {rule_flags}
Resume: {resume_text[:3000]}
JD: {jd_text[:2000]}

Return ONLY valid JSON:
{{
  "verdict":"Strong Hire | Good Candidate | Maybe | Needs Improvement | Reject",
  "verdict_reason":"1-2 sentence justification",
  "overall_score":82,
  "scores":{{"skill_match":85,"experience_relevance":78,"communication_clarity":80,"technical_depth":75,"culture_fit_indicators":70}},
  "candidate_summary":"3-4 sentence summary",
  "strengths":["s1","s2","s3"],
  "red_flags":["f1","f2"],
  "skill_match_breakdown":{{"matched":["s1"],"missing_critical":["s2"],"missing_nice_to_have":["s3"],"bonus_skills":["s4"]}},
  "interview_questions":[{{"question":"...","reason":"why"}}],
  "hiring_recommendation":"2-3 sentence recommendation",
  "salary_band_fit":"entry | mid | senior | lead"
}}
"""
    try:
        result = parse_json(grok_text(system, user, max_tokens=3000))
        result["_meta"] = {"sem_score": sem_score, "ats_score": ats_final, "match_pct": match_pct, "rule_flags": rule_flags}
        return result
    except Exception as e:
        logger.warning("Recruiter analysis parse error: %s", e)
        return {}

async def ats_shared_pipeline(file_bytes: bytes, jd_text: str) -> dict:
    resume_text = extract_text_from_pdf(file_bytes)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
    resume_text = resume_text[:15000]
    jd_text     = jd_text.strip()[:10000]
    warnings = []
    jd_kw_count = len({w for w in set(re.findall(r"\w+", jd_text.lower()))
                        if len(w) > 2 and w not in _STOPWORDS and not w.isdigit()})
    if jd_kw_count < 15:
        warnings.append(f"JD only has {jd_kw_count} keywords — scores may be unreliable.")
    sem_score             = ats_semantic_score(resume_text, jd_text)
    ats_final, kw_density = ats_keyword_score(resume_text, jd_text)
    resume_skills         = ats_extract_skills(resume_text)
    jd_skills             = ats_extract_skills(jd_text)
    return {
        "resume_text": resume_text, "jd_text": jd_text,
        "sem_score": sem_score, "ats_final": ats_final, "kw_density": kw_density,
        "resume_skills": resume_skills, "jd_skills": jd_skills, "warnings": warnings,
    }

ats_tag = ["🚀 ATS Resume Analyzer"]

@app.post("/ats/candidate", tags=ats_tag, summary="Candidate mode — ATS scores + skill gap + learning roadmap")
async def ats_candidate(
    resume: UploadFile = File(..., description="Resume PDF"),
    job_description: str = Form(..., description="Full job description text"),
):
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")
    file_bytes    = await resume.read()
    data          = await ats_shared_pipeline(file_bytes, job_description)
    resume_skills = data["resume_skills"]
    jd_skills     = data["jd_skills"]
    missing       = sorted(jd_skills - resume_skills)
    roadmap       = ats_learning_roadmap(missing, list(resume_skills)) if missing else {}
    debug         = ats_debug_info(data["resume_text"], data["jd_text"])
    return {
        "warnings":        data["warnings"],
        "semantic_score":  data["sem_score"],
        "ats_score":       data["ats_final"],
        "keyword_density": data["kw_density"],
        "resume_skills":   sorted(resume_skills),
        "jd_skills":       sorted(jd_skills),
        "missing_skills":  missing,
        "roadmap":         roadmap,
        "debug":           debug,
    }

@app.post("/ats/recruiter", tags=ats_tag, summary="Recruiter mode — hiring verdict + scorecard + interview questions")
async def ats_recruiter(
    resume: UploadFile = File(..., description="Candidate resume PDF"),
    job_description: str = Form(..., description="Full job description text"),
):
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")
    file_bytes = await resume.read()
    data       = await ats_shared_pipeline(file_bytes, job_description)
    report     = ats_recruiter_analysis(
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


# ═════════════════════════════════════════════════════════════════════════════
#  MODULE 4 — AI INTERVIEW GUIDE
# ═════════════════════════════════════════════════════════════════════════════
class InterviewSetupRequest(BaseModel):
    role:       str       = Field(..., examples=["Senior Data Scientist"])
    experience: str       = Field(..., examples=["Senior Level (5-8 yrs)"])
    focus:      list[str] = Field([], examples=[["Machine Learning", "System Design"]])

class InterviewChatRequest(BaseModel):
    role:     str        = Field(...)
    question: str        = Field(...)
    answer:   str        = Field(...)
    history:  list[dict] = Field([])

class InterviewFeedbackRequest(BaseModel):
    role:      str        = Field(...)
    questions: list[dict] = Field(...)
    answers:   list[str]  = Field(...)

def interview_generate_questions(role: str, experience: str, focus: list[str]) -> list:
    focus_str = f"Focus especially on: {', '.join(focus)}." if focus else ""
    system = "You are an expert technical interviewer. Return ONLY valid JSON, no markdown."
    user = f"""
Generate 7 interview questions for a {experience} {role} candidate.
Mix: 2 behavioral, 3 technical, 1 system design, 1 situational. {focus_str}

Return ONLY valid JSON:
{{
  "questions": [
    {{"id":1,"type":"technical","question":"...","hint":"What the interviewer is looking for","difficulty":"easy | medium | hard"}}
  ]
}}
"""
    try:
        return parse_json(grok_text(system, user, max_tokens=2048)).get("questions", [])
    except Exception as e:
        logger.warning("Questions parse error: %s", e)
        return []

def interview_chat(question: str, answer: str, role: str, history: list[dict]) -> str:
    history_text = "".join(f"Q: {h.get('question','')}\nA: {h.get('answer','')}\n\n" for h in history[-4:])
    system = f"You are a professional {role} interviewer in a mock interview. Stay in character — no scores or feedback yet."
    user = f"""
Previous exchanges:
{history_text}
Current question: {question}
Candidate's answer: {answer}

Respond as a real interviewer:
- Acknowledge briefly (1 sentence)
- Ask a natural follow-up or probe deeper
- Keep it to 2-4 sentences, professional but conversational
"""
    return grok_text(system, user, max_tokens=512)

def interview_generate_feedback(role: str, questions: list[dict], answers: list[str]) -> dict:
    qa_pairs = "".join(
        f"Q{i+1} ({q.get('type','')}, {q.get('difficulty','')}): {q.get('question','')}\nAnswer: {a}\n\n"
        for i, (q, a) in enumerate(zip(questions, answers))
    )
    system = f"You are a senior {role} interviewer giving post-interview feedback. Return ONLY valid JSON, no markdown."
    user = f"""
Interview transcript:
{qa_pairs}

Return ONLY valid JSON:
{{
  "overall_score":75,"communication_score":80,"technical_score":70,"confidence_score":75,
  "verdict":"Strong Candidate | Good Candidate | Needs Improvement | Not Ready",
  "summary":"2-3 sentence overall assessment",
  "strengths":["strength 1","strength 2","strength 3"],
  "weaknesses":["weakness 1","weakness 2"],
  "suggestions":["suggestion 1","suggestion 2","suggestion 3"],
  "per_question":[
    {{"question_id":1,"score":80,"comment":"brief feedback","ideal_answer_hint":"what a great answer includes"}}
  ],
  "next_steps":["action 1","action 2","action 3"]
}}
"""
    try:
        return parse_json(grok_text(system, user, max_tokens=3000))
    except Exception as e:
        logger.warning("Feedback parse error: %s", e)
        return {}

interview_tag = ["🎯 AI Interview Guide"]

@app.post("/interview/questions", tags=interview_tag, summary="Generate 7 interview questions for a role")
async def interview_questions(req: InterviewSetupRequest):
    if not req.role.strip():
        raise HTTPException(status_code=400, detail="Role cannot be empty.")
    questions = interview_generate_questions(req.role.strip(), req.experience, req.focus)
    if not questions:
        raise HTTPException(status_code=500, detail="Could not generate questions. Please try again.")
    return {"questions": questions}

@app.post("/interview/chat", tags=interview_tag, summary="Get AI interviewer follow-up after a candidate answer")
async def interview_chat_route(req: InterviewChatRequest):
    if not req.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")
    return {"followup": interview_chat(req.question, req.answer.strip(), req.role, req.history)}

@app.post("/interview/feedback", tags=interview_tag, summary="Get full performance feedback after the interview")
async def interview_feedback(req: InterviewFeedbackRequest):
    if not req.questions:
        raise HTTPException(status_code=400, detail="Questions list cannot be empty.")
    if not req.answers:
        raise HTTPException(status_code=400, detail="Answers list cannot be empty.")
    fb = interview_generate_feedback(req.role, req.questions, req.answers)
    if not fb:
        raise HTTPException(status_code=500, detail="Could not generate feedback. Please try again.")
    return fb


# ═════════════════════════════════════════════════════════════════════════════
#  HEALTH + ROOT
# ═════════════════════════════════════════════════════════════════════════════
@app.get("/health", tags=["⚙️ System"], summary="Health check")
async def health():
    return {
        "status": "ok",
        "model":  GROK_MODEL,
        "client": "single xAI client (all 4 modules)",
        "modules": {
            "chat":      {"key_env": "XAI_API_KEY", "endpoints": ["POST /chat/message"]},
            "market":    {"key_env": "XAI_API_KEY", "endpoints": ["POST /market/analyze"]},
            "ats":       {"key_env": "XAI_API_KEY", "endpoints": ["POST /ats/candidate", "POST /ats/recruiter"]},
            "interview": {"key_env": "XAI_API_KEY", "endpoints": ["POST /interview/questions", "POST /interview/chat", "POST /interview/feedback"]},
        },
    }

@app.get("/", tags=["⚙️ System"], summary="API info")
async def root():
    return {
        "title":      "🚀 Unified AI Career Platform",
        "version":    "5.0.0",
        "model":      GROK_MODEL,
        "swagger_ui": "/docs",
        "redoc":      "/redoc",
        "endpoints": {
            "chat":      ["POST /chat/message"],
            "market":    ["POST /market/analyze"],
            "ats":       ["POST /ats/candidate", "POST /ats/recruiter"],
            "interview": ["POST /interview/questions", "POST /interview/chat", "POST /interview/feedback"],
        },
    }