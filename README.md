# StudyPack AI — Ghosting Paradox

React + Express prototype for the Prompt Engineering Mini Project: Lecture Notes to Study Pack (Problem C2).

## Features
- Paste lecture notes or upload PDF/TXT files (text-based PDFs)
- Select subject and difficulty
- Generate summaries, important topics, key concepts, key terms, 10 practice questions and answers using Gemini
- Copy the study pack or download it as PDF

## Requirements
- Node.js 22 or later
- Gemini API key from https://aistudio.google.com/app/apikey

## Setup
1. Open `server/.env.example`, copy it to `server/.env`.
2. Put your key after `GEMINI_API_KEY=` in `server/.env`. Never share or commit this key.
3. In a terminal at the project root:

```bash
cd server
npm install
```

4. Open a second terminal at the project root:

```bash
cd client
npm install
```

5. Start backend in terminal 1:

```bash
cd server
npm run dev
```

6. Start frontend in terminal 2:

```bash
cd client
npm run dev
```

7. Open http://localhost:5173

## GitHub
Create a repository named `ghosting-paradox-study-pack`, then run these commands from the project root:

```bash
git init
git add .
git commit -m "Initial StudyPack AI prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ghosting-paradox-study-pack.git
git push -u origin main
```

Replace YOUR-USERNAME with your GitHub username.

## Important
- `.env` is ignored by Git. Do not upload your API key.
- GitHub stores the source code; it does not automatically deploy the running app.
- This is a starter prototype source package. Run and test it locally, resolve any setup issues, and verify each feature before claiming it works in your submission.
- Scanned PDFs without selectable text are not supported by the built-in PDF text extraction.
