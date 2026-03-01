import os
import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Interview Guide API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Init Gemini ───────────────────────────────────────────────────────────────

api_key = os.getenv("INTERVIEW_API_KEY")
if not api_key:
    raise RuntimeError("INTERVIEW_API_KEY not found in .env file.")

client = genai.Client(api_key=api_key)
GEMINI_MODEL = "gemini-2.5-flash"


# ── Request Models ────────────────────────────────────────────────────────────

class SetupRequest(BaseModel):
    role: str
    experience: str
    focus: list[str] = []

class ChatRequest(BaseModel):
    role: str
    question: str
    answer: str
    history: list[dict] = []   # [{"question": "...", "answer": "..."}]

class FeedbackRequest(BaseModel):
    role: str
    questions: list[dict]      # full question objects from /generate-questions
    answers: list[str]         # answers in same order as questions


# ── Core Logic ────────────────────────────────────────────────────────────────

def gemini(prompt: str) -> str:
    response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text.strip()


def generate_questions(role: str, experience: str, focus: list[str]) -> list:
    focus_str = f"Focus especially on: {', '.join(focus)}." if focus else ""
    prompt = f"""
You are an expert technical interviewer.

Generate 7 interview questions for a {experience} {role} candidate.
Mix of: 2 behavioral, 3 technical, 1 system design, 1 situational.
{focus_str}

Return ONLY valid JSON (no markdown):
{{
  "questions": [
    {{
      "id": 1,
      "type": "technical",
      "question": "...",
      "hint": "What the interviewer is looking for",
      "difficulty": "easy | medium | hard"
    }}
  ]
}}
"""
    text = gemini(prompt)
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned).get("questions", [])
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Could not parse questions JSON: %s", e)
        return []


def chat_with_interviewer(question: str, answer: str, role: str, history: list) -> str:
    history_text = ""
    for h in history[-4:]:
        history_text += f"Q: {h.get('question', '')}\nA: {h.get('answer', '')}\n\n"

    prompt = f"""
You are a professional {role} interviewer conducting a mock interview.

Previous exchanges:
{history_text}

Current question: {question}
Candidate's answer: {answer}

Respond as a real interviewer would:
- Acknowledge their answer briefly (1 sentence)
- Ask a natural follow-up OR probe deeper into their answer
- Keep your response concise (2-4 sentences max)
- Be professional but conversational
- Do NOT give scores or feedback yet — this is still the interview
"""
    return gemini(prompt)


def generate_feedback(role: str, questions: list, answers: list) -> dict:
    qa_pairs = ""
    for i, (q, a) in enumerate(zip(questions, answers)):
        qa_pairs += f"Q{i+1} ({q.get('type', '')}, {q.get('difficulty', '')}): {q.get('question', '')}\nAnswer: {a}\n\n"

    prompt = f"""
You are a senior {role} interviewer providing detailed post-interview feedback.

Interview transcript:
{qa_pairs}

Provide comprehensive performance feedback. Return ONLY valid JSON (no markdown):
{{
  "overall_score": 75,
  "communication_score": 80,
  "technical_score": 70,
  "confidence_score": 75,
  "verdict": "Strong Candidate | Good Candidate | Needs Improvement | Not Ready",
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "per_question": [
    {{
      "question_id": 1,
      "score": 80,
      "comment": "brief feedback on this answer",
      "ideal_answer_hint": "what a great answer would include"
    }}
  ],
  "next_steps": ["action 1", "action 2", "action 3"]
}}
"""
    text = gemini(prompt)
    cleaned = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Could not parse feedback JSON: %s", e)
        return {}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/generate-questions")
async def api_generate_questions(req: SetupRequest):
    """
    Generate 7 interview questions.

    Request:
    {
        "role": "Senior Data Scientist",
        "experience": "Senior Level (5-8 yrs)",
        "focus": ["Machine Learning", "System Design"]
    }

    Response:
    {
        "questions": [
            { "id": 1, "type": "technical", "question": "...", "hint": "...", "difficulty": "medium" },
            ...
        ]
    }
    """
    if not req.role.strip():
        raise HTTPException(status_code=400, detail="Role cannot be empty.")

    questions = generate_questions(req.role.strip(), req.experience, req.focus)
    if not questions:
        raise HTTPException(status_code=500, detail="Could not generate questions. Please try again.")

    return {"questions": questions}


@app.post("/chat")
async def api_chat(req: ChatRequest):
    """
    Get AI interviewer follow-up after candidate submits an answer.

    Request:
    {
        "role": "Senior Data Scientist",
        "question": "Tell me about a time you handled a failing ML model.",
        "answer": "I noticed our model accuracy dropping and...",
        "history": [
            { "question": "prev question", "answer": "prev answer" }
        ]
    }

    Response:
    {
        "followup": "That's a solid approach. Could you walk me through how you decided on the retraining strategy?"
    }
    """
    if not req.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    followup = chat_with_interviewer(
        req.question, req.answer.strip(), req.role, req.history
    )
    return {"followup": followup}


@app.post("/feedback")
async def api_feedback(req: FeedbackRequest):
    """
    Generate full performance feedback after interview is complete.

    Request:
    {
        "role": "Senior Data Scientist",
        "questions": [ ...objects from /generate-questions... ],
        "answers": ["my answer 1", "my answer 2", "[Skipped]", ...]
    }

    Response:
    {
        "overall_score": 75,
        "communication_score": 80,
        "technical_score": 70,
        "confidence_score": 75,
        "verdict": "Good Candidate",
        "summary": "...",
        "strengths": [...],
        "weaknesses": [...],
        "suggestions": [...],
        "per_question": [...],
        "next_steps": [...]
    }
    """
    if not req.questions:
        raise HTTPException(status_code=400, detail="Questions list cannot be empty.")
    if not req.answers:
        raise HTTPException(status_code=400, detail="Answers list cannot be empty.")

    fb = generate_feedback(req.role, req.questions, req.answers)
    if not fb:
        raise HTTPException(status_code=500, detail="Could not generate feedback. Please try again.")

    return fb