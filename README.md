# ☕ The Café Companion

> **Built for the Google Cloud Builder Pop-Up Hackathon**  
> An AI-powered dual-pulse café solution uniting patrons and baristas using **Gemini APIs**, **Cloud Run**, and **Cloud SQL**.

---

## 🌟 What is The Café Companion?

Cafés are places to work, meet, connect, and unwind. **The Café Companion** transforms the café experience by connecting customers and café staff through two synchronized interfaces:

1. **📱 Customer Mobile Concierge:**
   * **Multimodal Ordering:** Order by talking in plain English or uploading a photo of a drink you like.
   * **Vibe Mode:** Auto-recommends items based on session intent (*Deep Work 💻*, *Quick Catch-up ☕*, *Unwind & Read 📖*, *Post-Workout ⚡*).
   * **The Serendipity Lounge:** Privacy-preserving co-working and social matchmaker with Gemini-generated icebreakers.
   * **Live ETA & Stepper:** Accurate wait times based on kitchen load.
   * **"Understand the Room" Feedback:** 1-tap micro-feedback (*"AC is cold"*, *"Great vibe"*).

2. **☕ Barista Co-Pilot & Room Pulse Dashboard:**
   * **"Understand the Room" Live Sentiment Radar:** Real-time mood meter, ambient ratings, and Gemini-generated actionable tips for baristas.
   * **AI Prep-Grouping:** Groups similar kitchen steps together (*"⚡ Batch Oat Milk Steaming for Table 2 & 5"*).
   * **Allergy Shield:** Real-time bold warnings for severe allergens and cross-contamination prevention.
   * **Quick Ticket Advancer:** 1-click order state updates (*Pending ➔ Brewing ➔ Ready ➔ Completed*).

---

## ☁️ Google Cloud Architecture

```
                                  +------------------------------------+
                                  |     Google Cloud Run Service       |
                                  |   (Single Multi-Stage Container)   |
  [ Patrons & Baristas ] <======> |   • React / Tailwind Frontend      |
                                  |   • FastAPI Backend                |
                                  +-----------------+------------------+
                                                    |
                   +--------------------------------+--------------------------------+
                   |                                                                 |
                   v                                                                 v
+--------------------------------------+                          +-------------------------------------+
|        Google Gemini 2.5 API         |                          |       Google Cloud SQL (PostgreSQL) |
| • Natural Language Conversational AI |                          | • Menu catalog & dietary metadata   |
| • Multimodal Photo Detection         |                          | • Orders queue & real-time telemetry|
| • "Understand the Room" Sentiment    |                          | • Serendipity profiles & matches    |
| • Safe Icebreaker Generation         |                          +-------------------------------------+
+--------------------------------------+
```

---

## 🚀 Running Locally

### 1. Prerequisites
* Python 3.12+
* Node.js 20+

### 2. Quick Start

#### Backend:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
The API server starts at `http://127.0.0.1:8080`.

#### Frontend (Development with Hot Reload):
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with both the Customer View and the Barista Dashboard.

---

## 🚢 Deploying to Google Cloud Run

We provide one-click deployment scripts that build and deploy the container directly from source:

### Windows (PowerShell):
```powershell
$env:GCP_PROJECT_ID = "the-cafe-companion"
$env:GEMINI_API_KEY = "your-api-key"
.\deploy\deploy.ps1
```

### Linux / Mac / Cloud Shell (Bash):
```bash
export GCP_PROJECT_ID="the-cafe-companion"
export GEMINI_API_KEY="your-api-key"
chmod +x ./deploy/cloudrun-deploy.sh
./deploy/cloudrun-deploy.sh
```

---

## 🏆 Hackathon Alignment Checklist

- [x] **Gemini APIs:** Powers multimodal photo recognition, dietary customization, room sentiment analysis, and social icebreakers.
- [x] **Cloud Run:** Containerized single-app deployment with auto-scaling and zero-CORS configuration.
- [x] **Cloud SQL:** Relational storage for orders, items, feedback, and customer preference vectors.
- [x] **Surprise Factor:** Dual-persona synchronization connecting the physical and digital room in real time.
