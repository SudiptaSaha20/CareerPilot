from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pypdf import PdfReader
import os

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# -----------------------
# Load environment
# -----------------------
load_dotenv()

app = FastAPI(title="AI Resume Analyzer API")

# Enable CORS (for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Initialize Gemini
# -----------------------
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.4,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# -----------------------
# Request Models
# -----------------------
class JobDescriptionRequest(BaseModel):
    job_description: str

class AnswerRequest(BaseModel):
    answer: str

# -----------------------
# Helper Function
# -----------------------
def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

# ==========================================================
# 1️⃣ Generate Interview Questions API
# ==========================================================
@app.post("/generate-questions")
async def generate_questions(data: JobDescriptionRequest):

    interview_template = PromptTemplate(
        input_variables=["jd"],
        template="""
Based on the following job description:

{jd}

Generate:
1. 5 Technical Interview Questions (only questions)
2. 3 HR Questions (only questions)
3. 3 Scenario-based Questions (only questions)
"""
    )

    final_prompt = interview_template.format(jd=data.job_description)
    result = llm.invoke(final_prompt)

    return {
        "status": "success",
        "questions": result.content
    }

# ==========================================================
# 2️⃣ Evaluate Candidate Answer API
# ==========================================================
@app.post("/evaluate-answer")
async def evaluate_answer(data: AnswerRequest):

    feedback_prompt = f"""
You are a technical interviewer.

Evaluate the candidate answer below.

Give:
1. Score out of 10
2. Strengths
3. Improvements
4. Better sample answer

Candidate Answer:
{data.answer}
"""

    result = llm.invoke(feedback_prompt)

    return {
        "status": "success",
        "feedback": result.content
    }

# ==========================================================
# 3️⃣ Upload Resume API
# ==========================================================
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    extracted_text = extract_text_from_pdf(file_path)

    return {
        "status": "success",
        "resume_text": extracted_text[:2000]  # limiting size
    }

# ==========================================================
# Health Check
# ==========================================================
@app.get("/")
def root():
    return {"message": "AI Resume Analyzer Backend Running 🚀"}