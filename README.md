# Mini AI SDR — Enterprise-Grade Sales Development Assistant

![Dashboard Overview](screenshots/dashboard.png)

A complete, production-ready full-stack application that acts as an autonomous Sales Development Representative. It qualifies leads using **LangGraph** and **OpenAI/Groq**, generates highly personalized outreach emails and call scripts via **Google Gemini 1.5 Flash**, and dispatches emails via SMTP.

## 📸 Platform Interface

| Analytics & Insights | Lead Management |
| :---: | :---: |
| ![Analytics](screenshots/analytics.png)<br>_Visual Analytics & Score Distribution_ | ![All Leads](screenshots/all_leads.png)<br>_Comprehensive Lead Pipeline & Status_ |

| AI Qualification & Email | Authentication & Setup |
| :---: | :---: |
| ![Lead Detail](screenshots/lead_detail.png)<br>_AI Qualification & Gemini Email/Script Generation_ | ![Login](screenshots/login.png)<br>_Secure Authentication & Onboarding_ |

---

## 🚀 Key Features

### 🧠 Autonomous Lead Qualification (LangGraph)
- Uses a **State Graph** architecture to evaluate leads based on Job Title, Industry, and Notes.
- **Dual LLM Strategy:** Primarily attempts qualification using **OpenAI GPT-3.5**. If API tokens are exhausted or unavailable, it seamlessly falls back to **Groq Llama-3.1**.
- Scores leads from 0–100, providing detailed reasoning and strategic next steps.

### ✉️ Hyper-Personalized Outreach (Gemini 1.5 Flash)
- Generates context-aware cold emails using frameworks like AIDA and PAS.
- Dynamically creates customized Call Scripts based on modes: *Direct Pitch*, *Gatekeeper Bypass*, *Follow-up*, and *Voicemail Drop*.
- Analyzes pain points and value hooks before drafting content, ensuring enterprise-quality communication.

### 📬 Native SMTP Email Dispatch
- Integrated SMTP dispatch system that directly emails leads from the dashboard.
- Simulates network delays for UX and seamlessly transitions leads to the `contacted` status.

### 📊 Comprehensive Analytics Dashboard
- Visualizes pipeline health, AI-scored metrics, and industry breakdowns.
- Real-time responsive charts using Tailwind CSS to monitor lead progression (Cold -> Warm -> Hot).

### 🛡️ Secure & Scalable Architecture
- **Backend:** FastAPI, SQLAlchemy ORM, and PostgreSQL. Protected via JWT authentication and Bcrypt password hashing. 
- **Frontend:** Next.js 14 App Router, Tailwind CSS, and Framer Motion. Fully responsive design handling complex UI states cleanly.
- **Containerization:** Fully dockerized with Docker Compose for seamless 1-click deployment.

---

## 🏗️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| **Frontend**   | Next.js 14 App Router, React, TypeScript, Tailwind CSS, Framer Motion, Axios |
| **Backend**    | FastAPI, SQLAlchemy, Pydantic v2, LangGraph |
| **Auth**       | JWT (python-jose), bcrypt (passlib)     |
| **Database**   | PostgreSQL 15                           |
| **AI Models**  | OpenAI GPT-3.5 (Primary) / Groq Llama 3.1 (Fallback) for qualification. Google Gemini 1.5 Flash for emails/scripts |
| **Container**  | Docker, Docker Compose                  |

---

## 🐳 Docker Setup (Recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- **OpenAI API key** ([platform.openai.com](https://platform.openai.com)) OR **Groq API key** ([console.groq.com](https://console.groq.com)). *Note: Since OpenAI no longer provides free tier tokens by default, a free Groq API key can be used as a seamless fallback for AI Qualification.*
- **Google Gemini API key** ([aistudio.google.com](https://aistudio.google.com)) - *Generates emails & call scripts.*

### Step 1: Configure Environment Variables

The application can start without API keys, but AI endpoints will fail. Copy the `.env.example` file and rename it to `.env` inside the `backend` folder:

```bash
cp backend/.env.example backend/.env
```

Edit the `backend/.env` file to include your credentials:

```env
# Database & Auth
DATABASE_URL=postgresql://sdr_user:sdr_password@postgres:5432/mini_sdr_db
JWT_SECRET=your-super-secret-jwt-key-change-this

# AI API Keys (Provide OpenAI OR Groq. Gemini is required)
OPENAI_API_KEY=sk-your-openai-api-key
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=your-gemini-api-key

# SMTP Credentials (Required for sending emails directly from app)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
```

**API Fallback Logic:** If both OpenAI and Groq keys are provided, the system primarily uses OpenAI. If the OpenAI key is invalid, out of credits, or throws an error, the system will automatically fall back to Groq. You only need to provide at least one of them for the Lead Qualification to work.

### Step 2: Build and Run

```bash
docker compose up --build -d
```

This will:
1. Start PostgreSQL 15 and run initialization scripts automatically.
2. Wait for the database health check to pass.
3. Start the FastAPI backend on port 8000.
4. Build and start the Next.js frontend on port 3000.

### Step 3: Access the Application

| Service   | URL                          |
|-----------|------------------------------|
| **Frontend**  | http://localhost:3000         |
| **API Backend**| http://localhost:8000         |
| **Swagger UI** | http://localhost:8000/api/docs |

**Demo User Credentials:**
```text
Email:    demo@minisdr.com
Password: Demo@123456
```



## 💻 Local Development (Without Docker)

If you prefer to run the application directly on your machine:

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Important: If running locally without Docker, open the .env file 
# and change the DATABASE_URL host from 'postgres' to 'localhost'
# e.g., DATABASE_URL=postgresql://sdr_user:sdr_password@localhost:5432/mini_sdr_db
uvicorn main:app --reload --port 8000
```

**Frontend Setup:**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

---

## 🤖 LangGraph Agent Architecture

The core of the SDR functionality is orchestrated via **LangGraph**, executing a stateful multi-node pipeline strictly for deep lead qualification:

```text
qualify_lead → finalize
```

1. **qualify_lead**: Scores the lead 0–100 using OpenAI GPT-3.5 (or Groq Llama-3.1 fallback) based on job title, industry, and notes.
2. **finalize**: Persists results to the database and completes the SDR loop.

*Note: Email and Call Script generation are handled strictly by Gemini 1.5 Flash via dedicated on-demand API endpoints to allow maximum user flexibility and multi-draft generation.*

---

**Developed by Rishabh Singh**
