from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file")

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        conversation = ""

        for msg in request.history:
            role = "User" if msg.role == "user" else "Assistant"
            conversation += f"{role}: {msg.text}\n"

        conversation += f"User: {request.message}\nAssistant:"

        response = model.generate_content(conversation)

        return {"reply": response.text if response.text else "No response generated."}

    except Exception as e:
        return {"reply": f"Error: {str(e)}"}