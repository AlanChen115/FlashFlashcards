# FlashFlashcards

FlashFlashcards is a modern flashcard generation app built with a Django backend and a React frontend. It supports file upload, website parsing, AI-powered flashcard generation, similarity checking, and export-ready flashcards.

---

## What it does

* Upload images or documents and generate flashcards from the content
* Add website links to extract text and convert it into flashcards
* Save generated flashcards in a backend store
* Detect similar cards using lemma-based matching
* Export flashcards for study workflows

---

## Current status

* ✅ Django backend with API endpoints
* ✅ React frontend with upload/modal flow
* ✅ File upload and link input support
* ✅ Similar flashcard detection
* ✅ Flashcard persistence via `storage` app
* ✅ Working frontend build with Vite
* 🚧 Export features and UX improvements ongoing
* 🚧 Storage of Flashcards and interacting with your database
* 🚧 Authentication and user accounts planned

---

## Tech stack

### Backend

* Python 3.11
* Django 5.2.7
* Django REST framework
* SQLite for local development

### Frontend

* React 19
* Vite
* React Router

---

## Repository structure

```text
FlashFlashcards/
├── backend/
│   ├── db.sqlite3
│   ├── manage.py
│   ├── test_pipeline.py
│   ├── Flashflashcards/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── ai_generator/
│   ├── exporter/
│   ├── storage/
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── src/
│   └── vite.config.js
└── README.md
```

---

## Core backend apps

### `storage`

Handles flashcard persistence, deduplication, and similarity checks.

### `ai_generator`

Parses uploaded files and website content, then converts raw text into structured flashcards using prompt-driven generation.

### `exporter`

Prepares flashcards for export formats and future external study support.

---

## Available API routes

The backend exposes multiple API namespaces under `/api/`:

* `/api/ai_generator/` — flashcard generation endpoints
* `/api/storage/` — storage, similarity, and import endpoints
* `/api/exporter/` — export-related endpoints

---

## Getting started

### Backend setup

1. Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install backend dependencies:

```powershell
pip install -r requirements.txt
```

3. Run migrations:

```powershell
python manage.py migrate
```

4. Start the backend server:

```powershell
python manage.py runserver
```
```

Server URL:

```text
http://127.0.0.1:8000
```

---

### Frontend setup

1. Install frontend dependencies:

```powershell
cd ../frontend
npm install
```

2. Start the development server:

```powershell
npm run dev
```
```

Access the frontend at:

```text
http://localhost:5173
```

---

## Testing

Run the backend pipeline test:

```powershell
cd backend
python test_pipeline.py
```

This covers scraping, AI generation, and basic export preparation.

---

## Notes

* The project uses a local SQLite database for development.
* `storage` is registered in the Django app registry so flashcards and language metadata are persisted.
* The frontend and backend are separate; ensure both are running when using the UI.

---

## Known limitations

* No authentication or user accounts yet
* Export/Anki integration is still partial
* Error handling can be improved
* Frontend UX may continue to evolve

---

## License

This project is currently unlicensed. Add a license file if you want to make it open source.


MIT License

---

## Author

Alan Chen

