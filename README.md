# 🚀 CareerPilot

**CareerPilot** is an end-to-end **AI-driven career optimization platform** built to eliminate blind job applications and equip users with *data-backed, actionable career insights*. It analyzes resumes, identifies skill gaps, simulates interviews, evaluates market demand, and helps users become job-ready with precision.

---

## 🌟 Key Features

✔ **AI Resume Analyzer**  
Use AI to extract insights from your resume and receive structured feedback on strengths and weaknesses.

✔ **Skill Gap Identifier**  
Automatically highlights skills you lack for roles you’re targeting.

✔ **Mock Interview Simulator**  
Practice realistic interview sessions powered by AI and get performance feedback.

✔ **Market Demand Evaluator**  
Check how in-demand your skills are in real job markets across locations.

✔ **Personalized Career Insights**  
Receive objective suggestions on areas to improve and roles to pursue.

✔ **Visual Dashboards & Metrics**  
Track progress with clean, intuitive dashboards and progress indicators.

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|------------|
| **Frontend** | React, Next.js, Tailwind CSS |
| **Backend** | FastAPI (Python) |
| **AI / ML** | Transformers, NLP models |
| **Database** | MongoDB |
| **Deployment** | Vercel (frontend), Python backend (Docker) |
| **Authentication** | NextAuth.js + JWT |

> This stack empowers modular design and scalable production-grade workflows.

---

## 🧠 How It Works

1. **Upload Resume**  
   Users upload a resume file (PDF / DOCX).

2. **AI Processing**  
   The AI extracts skills, experience, and structure using NLP.

3. **Gap Mapping**  
   The system compares extracted skills against target job profiles.

4. **Interview Simulation**  
   Users engage with an AI interviewer to prepare responses.

5. **Actionable Output**  
   Personalized insights arrive in dashboards and detailed reports.

---

## 📦 Installation & Setup

> ⚡ You need **Node.js**, **Python**, and appropriate credentials/API keys (if any).

### 1. Clone the Repo

```bash
git clone https://github.com/SudiptaSaha20/CareerPilot.git
cd CareerPilot
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file with your API keys:

```bash
GOOGLE_API_KEY=your_key_here
DATABASE_URL=your_mongodb_url
PYTHON_API_PORT=8000
```

Start the backend:

```bash
uvicorn api:app --reload
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file with your configuration:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=your_mongodb_url
```

Start the frontend:

```bash
npm run dev
```

### 4. Visit in Browser

Open: http://localhost:3000

## 📌 Usage

Once launched, users can:

- Upload resumes to get automated analysis
- View skill gaps against any role
- Practice mock interviews
- Check demand scores for roles

Each section provides clear guidance and suggestions for improving your career positioning.

## 🧩 Folder Structure

```
.
├── backend/                    # FastAPI server + AI/ML logic
│   ├── api.py                  # Main API routes
│   ├── requirements.txt         # Python dependencies
│   └── interview/              # Virtual environment
├── frontend/                   # React + Next.js application
│   ├── app/                    # Next.js app directory
│   ├── components/             # Reusable React components
│   ├── prisma/                 # Database schema & client
│   └── package.json            # Node dependencies
├── README.md                   # This file
└── LICENSE                     # MIT License
```

## 🛠️ Contributing

- Fork the repository
- Create a new branch: `git checkout -b feature/your-feature`
- Make updates and commit: `git commit -m "Add feature"`
- Push and open a Pull Request

Contributions are welcome!

## 📜 License

This project is licensed under the MIT License — see the LICENSE file for details.

## 📝 Final Notes

CareerPilot is designed to be intuitive for both job seekers and developers who want a foundation for building intelligent career tools. Improve the platform by integrating more models, richer analytics, and tighter feedback loops.