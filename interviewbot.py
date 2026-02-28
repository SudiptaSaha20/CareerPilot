import streamlit as st
from dotenv import load_dotenv
import os
from pypdf import PdfReader

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# Load API key
load_dotenv()

# Initialize Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.4,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

st.header("🚀 AI Resume Analyzer & Interview Bot")

# --------------------------
# Resume Upload
# --------------------------
uploaded_file = st.file_uploader("Upload Your Resume (PDF)", type="pdf")
job_description = st.text_area("Paste Job Description")

def extract_text_from_pdf(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

# 

# --------------------------
# Interview Question Prompt
# --------------------------
interview_template = PromptTemplate(
    input_variables=["jd"],
    template="""
Based on the following job description:

{jd}

Generate:
1. 5 Technical Interview Questions,give only questions without answers
2. 3 HR Questions,give only questions without answers
3. 3 Scenario-based Questions,give only questions without answers
"""
)

# --------------------------
# Buttons
# --------------------------


# --------------------------
# Interview Question Generator
# --------------------------
if st.button("Generate Interview Questions"):
    if job_description:

        final_prompt = interview_template.format(jd=job_description)
        result = llm.invoke(final_prompt)

        st.subheader("🎤 Interview Questions")
        st.write(result.content)

    else:
        st.warning("Paste job description first!")

# --------------------------
# Interview Chat Bot
# --------------------------
st.subheader("🤖 Live Interview Bot")

user_answer = st.text_area("Answer a question from above:")

if st.button("Get Feedback"):
    if user_answer:

        feedback_prompt = f"""
You are a technical interviewer.

Evaluate the candidate answer below.

Give:
1. Score out of 10
2. Strengths
3. Improvements
4. Better sample answer

Candidate Answer:
{user_answer}
"""

        result = llm.invoke(feedback_prompt)

        st.write(result.content)

    else:
        st.warning("Write your answer first!")
        