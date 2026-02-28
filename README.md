# InterviewBot

Simple Interview chatbot that analyzes a resume and runs an interactive interview using LangChain + OpenAI.

Prerequisites
- Python 3.8+
- An OpenAI API key set in `OPENAI_API_KEY` environment variable

Install
```bash
python -m pip install -r requirements.txt
```

Usage
```bash
python interviewbot.py path/to/resume.pdf
```

Or run without an argument and you'll be prompted for a resume path.

Notes
- Supports PDF, DOCX and plain text resumes.
- The script uses `langchain`'s `ChatOpenAI`. Configure `OPENAI_API_KEY` before running.
- You can pass `--model` to select a different ChatOpenAI model name if your environment supports it.

Example
```bash
setx OPENAI_API_KEY "sk-..."
python interviewbot.py resume.pdf
```
# CareerPilot
CareerPilot is an end-to-end AI-driven career optimization platform designed to eliminate blind job applications and empower users with data-backed career insights.  It analyzes resumes, identifies skill gaps, simulates interviews, and evaluates market demand to help users become job-ready with precision.
