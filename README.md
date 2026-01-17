# FlashFlashcards

FlashFlashcards is a **backend-first flashcard generation system** built with Django. The project focuses on the **end-to-end pipeline** for turning raw text (scraped or user-provided) into structured flashcards, with optional export to study tools such as Anki.

At its current stage, the project intentionally prioritizes **backend correctness and data flow**. A frontend UI has **not yet been implemented** and the existing `frontend/` directory is only a placeholder.

---

## Project Status (Current)

* ✅ Django backend scaffolded and running
* ✅ Modular pipeline: **scraping → generation → export**
* ✅ AI-driven flashcard generation (prompt-based)
* ✅ Local pipeline testing via script
* 🚧 Export layer (partial, extensible)
* 🚧 Frontend UI (basic UI)
* 🚧 Authentication, persistence, and user management (planned)

This README documents **what is currently implemented**, with clearly marked limitations.

---

## Tech Stack

### Backend

* **Python 3.11**
* **Django**
* **SQLite** (development)
* Prompt-based AI generation (via `ai_generator`)

### Frontend

* React

---

## High-Level Architecture

The backend is organized as a **pipeline of loosely coupled Django apps**:

1. **Scraper** — collects raw text from supported sources
2. **AI Generator** — converts raw text into structured flashcards
3. **Exporter** — prepares flashcards for external formats (e.g., Anki)

Each stage can be tested independently or run end-to-end.

---

## Repository Structure

```text
FlashFlashcards/
├── backend/
│   ├── manage.py
│   ├── db.sqlite3
│   ├── test_pipeline.py        # End-to-end local pipeline test
│   │
│   ├── Flashflashcards/        # Django project configuration
│   │   ├── urls.py             # Root URL routing
│   │   ├── views.py            # Project-level views (minimal)
│   │   └── wsgi.py
│   │
│   ├── scraper/                # Text acquisition layer
│   │   ├── views.py            # Scraping API endpoints
│   │   ├── urls.py
│   │   └── utils.py            # Source-specific scraping logic
│   │
│   ├── ai_generator/           # Flashcard generation logic
│   │   ├── views.py            # Generation endpoints
│   │   ├── urls.py
│   │   ├── utils.py            # Prompt handling + parsing
│   │   └── prompts/            # Prompt templates
│   │       └── japanese_flashcards.txt
│   │
│   └── exporter/               # Export layer (partial)
│       ├── utils.py            # Export helpers
│       └── models.py           # Placeholder / future expansion
│
├── frontend/                   # Basic react frontend
└── README.md
```

---

## Backend Components

### 1. Scraper (`scraper` app)

**Purpose:**

* Retrieve raw text from supported sources
* Normalize scraped content for downstream processing

**Notes:**

* Scraping logic is source-specific and isolated in `utils.py`
* Designed to be extended with additional sources
* Output is plain text, not flashcards

---

### 2. AI Generator (`ai_generator` app)

**Purpose:**

* Convert raw text into structured flashcards
* Enforce learner-focused constraints via prompts

**Key Features:**

* Prompt templates stored in `prompts/`
* Controlled output format for predictable parsing
* Focus on learner-relevant vocabulary:

  * verbs
  * nouns
  * adjectives (い / な)
  * adverbs
  * important proper nouns

**Design Choice:**

Prompt logic is kept separate from view logic to allow:

* rapid iteration on prompts
* future model or provider changes

---

### 3. Exporter (`exporter` app)

**Purpose:**

* Prepare generated flashcards for external formats

**Current State:**

* Export layer is **partially implemented**
* Designed to support Anki (`.apkg`) and other formats
* Logic is intentionally decoupled from generation

---

## API Design Philosophy

* Backend-first, API-driven development
* No frontend assumptions baked into endpoints
* Focus on clarity and testability over completeness

⚠️ API contracts are **not yet stable** and may change as development continues.

---

## Running the Backend Locally

### 1. Create and activate a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

This project does **not** currently ship with a `requirements.txt`. Based on the existing backend code, install the required packages manually:

```bash
pip install django djangorestframework selenium groq
```

> Note: Selenium also requires a compatible browser driver (e.g., ChromeDriver) installed and available on your system.

### 3. Apply migrations

```bash
cd backend
python manage.py migrate
```

### 4. Run the development server

```bash
python manage.py runserver
```

Server will be available at:

```
http://127.0.0.1:8000/
```

[http://127.0.0.1:8000/](http://127.0.0.1:8000/)

```

Frontend Setup (Vite)
1. Install frontend dependencies

```bash
cd frontend
npm install
```

2. Start the development server
```
npm run dev
```

Frontend will be available at:
```
http://localhost:5173/
````

The frontend communicates with the Django backend via HTTP APIs.
CORS configuration may be required depending on your setup.
---

## Testing the Pipeline

A basic end-to-end test is provided:

```bash
python backend/test_pipeline.py
````

This script exercises:

* scraping
* AI generation
* export preparation

without requiring a frontend or database setup beyond SQLite.

---

## Known Limitations

* No frontend or user interface
* No authentication or user accounts
* No persistent deck management
* Export functionality is incomplete
* Error handling and validation are minimal

These limitations are intentional at this stage and reflect the project’s focus on backend pipeline development.

---

## Roadmap (Indicative)

* Frontend UI (likely React or similar)
* User authentication and deck persistence
* Full Anki `.apkg` export support
* Improved API stability and documentation
* Expanded scraping source support

---

## License

MIT License

---

## Author

Alan Chen

