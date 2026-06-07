# TDC Matchmaker MVP

## Deliverables
- **Live Hosted Link:**  https://tdc-match-making.vercel.app
- **GitHub Repo:**  git@github.com:vinishdas/TDC_MatchMaking.git

---

## Project Write-up

### Tech Choices
This application was built using **Next.js (App Router)** and React. Next.js was chosen for its robust server-side rendering, seamless API route integration, and optimal performance out-of-the-box. The styling utilizes **Vanilla CSS Modules** to maintain a bespoke, highly customized luxury aesthetic without the overhead of heavy utility frameworks. We utilized `lucide-react` for clean, elegant iconography, and the **Groq API** to power ultra-fast AI inference operations. 

### Matching Logic
The matchmaking system operates on a hybrid architecture that combines deterministic filtering with weighted scoring:
1. **Phase 1: Dealbreaker Filtering:** The system first enforces hard constraints. It strictly filters out candidates who do not match the target client's non-negotiable preferences regarding gender, age boundaries, smoking/drinking habits, dietary restrictions, and willingness to relocate or have children. It also actively excludes individuals the client has already matched with.
2. **Phase 2: Core Scoring System:** The remaining pool is scored out of 100 points based on weighted criteria. Points are awarded for overlapping lifestyle choices, shared hobbies, educational parity, and complementary income brackets.

### How AI is Used
AI is integrated directly into the matchmaking workflow to act as a high-level assistant:
1. **Semantic Match Evaluation:** Instead of relying purely on rigid data points, the top candidates from the core algorithm are passed to a Large Language Model (via Groq). The AI analyzes unstructured biographical text, relationship goals, and nuanced lifestyle descriptions to dynamically adjust the compatibility score, returning a detailed, human-like reasoning for *why* the match makes sense.
2. **Curated Introductions:** Once a match is approved, the AI automatically drafts a highly personalized, professional introduction email tailored specifically to the unique dynamics of the two paired individuals.

### Assumptions Made
- Data persistence is currently mocked via a local JSON database and file system writes. A production environment will require a migration to a secure, relational database like PostgreSQL.
- Authentication is currently mocked for the sake of the MVP (`admin`/`admin`). Production will require a robust OAuth or JWT implementation.
- All email generation is strictly drafted to the UI for the matchmaker's review; an actual SMTP integration (e.g., SendGrid) will be required to physically dispatch the emails.
