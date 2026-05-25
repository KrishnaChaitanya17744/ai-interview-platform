#  AI Interview Practice Platform

> Practice interviews like a pro — company-specific questions, voice responses, real-time behavioral analysis, and instant AI feedback.

---

##  Abstract

In an era of competitive hiring and rapidly evolving technical standards, the value of interview preparation lies in its depth of personalization, not just its volume of practice.

We developed an AI-powered interview practice platform to bridge the gap between generic preparation resources and the necessity for candidate-specific, data-driven coaching.

Unlike conventional mock interview tools that rely on static question banks and manual evaluator feedback, this system operates on a continuous-assessment architecture that analyzes performance, behavior, and communication as they unfold in real time.

It doesn't just score answers — it constructs a transparent, evidence-backed performance profile that reinforces technical confidence, identifies recurring weak areas, and guides each candidate toward deliberate, measurable improvement.

---

##  Features

###  Authentication
- Secure email/password registration and login
- JWT-based authentication (7-day expiry)
- Protected routes — all sessions linked to authenticated users
- Persistent login via localStorage

###  Company-Specific Question Generation
- **Hybrid approach:** Gemini AI primary → curated dataset fallback
- **15 companies:** Google, Amazon, Meta, Microsoft, Apple, TCS, Infosys, Wipro, HCL, Tech Mahindra, Flipkart, Zoho, Paytm, Startup, General
- **4 roles:** Frontend, Backend, Data Science, HR Round
- 141 curated questions from GeeksforGeeks, Glassdoor, Kaggle, LeetCode
- Duplicate detection using Jaccard similarity

###  Voice Response System
- One-shot recording with MediaRecorder API
- Dual transcription: OpenAI Whisper → Browser Speech API fallback
- Adaptive silence detection (calibrates to ambient noise floor)
- Auto-stops after 8 seconds of silence
- Maximum 3-minute recording limit

###  Real-Time Behavioral Analysis
- MediaPipe Face Landmarker running in-browser via WebAssembly
- GPU delegate → CPU fallback
- 15fps analysis with 8-frame temporal smoothing
- **Tracks:** Eye contact, head stability, smile rate, face presence, engagement score (0–10)
- 150-frame sliding window for responsive live display

###  AI Evaluation & Scoring
- Gemini 2.5 Flash evaluates spoken answers
- Scoring: Technical accuracy (40%), Clarity (30%), Concept coverage (30%)
- Structured output: Score, Strengths, Improvements, Summary
- Context-aware evaluation per company

###  Personalized Recommendations
- Analyzes last 10 sessions per user
- Generates: progress summary, weak areas, strengths, study recommendations, 7-day study plan, next practice suggestion, behavioral feedback

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework + build tool |
| React Router DOM 6 | Client-side routing |
| MediaPipe Tasks Vision 0.10.12 | Face detection (WebAssembly) |
| Web Audio API | Adaptive silence detection |
| MediaRecorder API | Audio capture |
| Web Speech API | Fallback transcription |
| CSS Variables | Design token system |
| Plus Jakarta Sans | Typography |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20+ | Runtime |
| Express.js 4 | Web framework |
| Mongoose 7+ | MongoDB ODM |
| jsonwebtoken | JWT authentication |
| bcryptjs | Password hashing |
| multer | Audio file uploads |
| dotenv | Environment variables |
| nodemon | Development server |

### Database & AI
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Google Gemini 2.5 Flash | Question generation, evaluation, recommendations |
| OpenAI Whisper API | Voice transcription |

---

## 📁 Project Structure

```
ai-interview-platform/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── context/
│       │   └── AuthContext.jsx    # Global auth state
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   └── InterviewPage.jsx
│       ├── components/
│       │   ├── RoleSelector.jsx
│       │   ├── QuestionDisplay.jsx
│       │   ├── VoiceInput.jsx
│       │   ├── VideoPanel.jsx
│       │   ├── FeedbackDisplay.jsx
│       │   ├── RecommendationPanel.jsx
│       │   └── ProtectedRoute.jsx
│       └── services/
│           ├── api.js
│           ├── WebcamManager.js
│           └── FaceAnalyzer.js
│
└── server/                        # Node.js + Express backend
    ├── config/
    │   ├── db.js
    │   ├── gemini.js
    │   ├── whisper.js
    │   └── questionValidator.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── models/
    │   ├── User.js
    │   ├── Session.js
    │   └── CompanyDataset.js
    ├── controllers/
    │   ├── authController.js
    │   ├── interviewController.js
    │   └── recommendationController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── interviewRoutes.js
    │   ├── audioRoutes.js
    │   └── recommendationRoutes.js
    ├── database/
    │   └── seedData.js
    └── index.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Google Gemini API key
- OpenAI API key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-interview-platform.git
cd ai-interview-platform
```

### 2. Setup Backend
```bash
cd server
npm install
```

Create `server/.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/interviewDB
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_secure_random_string_min_32_chars
```

Seed the database:
```bash
node database/seedData.js
```

Start the server:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```

### 4. Open in Browser
```
http://localhost:5173
```

---

## 🔌 API Reference

### Auth Endpoints
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login with email + password
GET    /api/auth/profile           Get current user (protected)
```

### Interview Endpoints
```
POST   /api/interview/generate-question    Generate question (protected)
POST   /api/interview/evaluate-answer      Evaluate answer (protected)
```

### Audio Endpoint
```
POST   /api/audio/transcribe       Transcribe audio file (multipart)
```

### User Endpoints
```
GET    /api/user/recommendations   Get AI study recommendations (protected)
GET    /api/user/history           Get session history (protected)
```

---

## 🔄 Application Flow

```
1. User registers / logs in
         ↓
2. Selects role + target company
         ↓
3. AI generates company-specific question
         ↓
4. User responds via voice (camera on)
         ↓
5. Voice → Whisper API → transcript
   Camera → MediaPipe → behavioral metrics
         ↓
6. Gemini evaluates answer
         ↓
7. Score + feedback + behavioral report shown
         ↓
8. AI generates personalized study plan
         based on full session history
```

---

## 🌐 Supported Companies

| Category | Companies |
|---|---|
| Big Tech | Google, Amazon, Meta, Microsoft, Apple |
| Indian IT | TCS, Infosys, Wipro, HCL, Tech Mahindra |
| Product / Unicorn | Flipkart, Zoho, Paytm |
| Other | Startup (General), General |

---

## 📊 Database Collections

| Collection | Purpose |
|---|---|
| users | Authenticated user accounts |
| sessions | All interview attempts linked to users |
| companydatasets | 141 curated interview questions |

---

## 🔒 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Express server port (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | OpenAI Whisper API key |
| `JWT_SECRET` | Secret string for signing JWT tokens |

---

## ⚙️ Key Design Decisions

| Decision | Reason |
|---|---|
| Hybrid question generation | AI for freshness, dataset for reliability |
| Browser-based face analysis | No server cost, no privacy risk, low latency |
| Adaptive silence threshold | Fixed thresholds fail with different mic environments |
| Sliding window metrics | Session-level accumulation caused frozen values when face absent |
| JWT in localStorage | Simplicity for SPA — upgrade to httpOnly cookies for production |
| Whisper + browser fallback | Whisper quota limits need graceful degradation |

---

## 🚢 Deployment

### Backend — Render
1. Connect GitHub repo to Render
2. Set root directory to `server/`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add all environment variables in Render dashboard
6. Update CORS origin to your frontend URL

### Frontend — Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `client/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Update `BASE_URL` in `api.js` to your Render backend URL

---

## 🧪 Testing the API

Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'
```

Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

Generate Question (replace TOKEN):
```bash
curl -X POST http://localhost:5000/api/interview/generate-question \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"frontend","companyType":"mnc","company":"google","askedQuestions":[]}'
```

---

## 👨‍💻 Built With

- **S Krishna Chaitanya** — Full-stack development
- **Google Gemini 2.5 Flash** — AI question generation, evaluation, recommendations
- **MediaPipe** — Real-time face and behavioral analysis
- **OpenAI Whisper** — Voice transcription

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- [Google MediaPipe](https://developers.google.com/mediapipe) — Face landmark detection
- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI backbone
- [OpenAI Whisper](https://openai.com/research/whisper) — Speech recognition
- [GeeksforGeeks](https://geeksforgeeks.org), [Glassdoor](https://glassdoor.com), [LeetCode](https://leetcode.com) — Question sources

---

> ⭐ Star this repo if you found it helpful!
