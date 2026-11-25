
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json({ limit: "2mb" }));

// Serve React frontend
const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "StudyPack AI server is running."
  });
});

// Generate study pack
app.post("/api/generate", async (req, res) => {
  try {
    const { notes, subject, difficulty } = req.body ?? {};

    if (typeof notes !== "string" || notes.trim().length < 30) {
      return res.status(400).json({
        error: "Please provide at least 30 characters of lecture notes."
      });
    }

    if (notes.length > 60000) {
      return res.status(400).json({
        error: "Please keep your notes under 60,000 characters."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is missing. Configure GEMINI_API_KEY in Render."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
You are StudyPack AI, an academic study assistant.
Create a clear study pack for a college student using ONLY the lecture notes supplied below.
Do not invent facts, definitions, examples, statistics, or claims not supported by the notes.
If a requested detail is absent, say: "Not covered in the supplied notes."
Use simple language appropriate to the selected difficulty.

Subject: ${String(subject || "Not specified").slice(0, 100)}
Difficulty: ${["Easy", "Medium", "Hard"].includes(difficulty) ? difficulty : "Medium"}

Return Markdown with these exact headings:
# Chapter Summary
# Important Topics
# Key Concepts
# Key Terms
# Practice Questions
# Answer Key

Requirements:
- Summary: concise but meaningful.
- Important Topics: identify main topics actually present.
- Key Concepts: explain important ideas in simple language.
- Key Terms: term followed by its meaning based only on the notes.
- Practice Questions: exactly 10 questions suitable for the selected difficulty.
- Answer Key: answers numbered 1 to 10, based only on the notes.
- If the notes are too short to support 10 meaningful questions, explain that limitation and do not fabricate content.

LECTURE NOTES:
"""${notes.trim()}"""
`;

    let response;

for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: prompt
});
    break;
  } catch (error) {
    const status = Number(
      error.status ?? error.error?.code ?? error.code
    );

    const isTemporaryError =
      [429, 500, 502, 503, 504].includes(status) ||
      /\b(429|500|502|503|504)\b/.test(error.message || "");

    if (!isTemporaryError || attempt === 2) {
      throw error;
    }

    await new Promise(resolve =>
      setTimeout(resolve, 2000 * (2 ** attempt))
    );
  }
}

    const studyPack = response.text?.trim();

    if (!studyPack) {
      return res.status(502).json({
        error: "The AI returned an empty response. Please try again."
      });
    }

    res.json({ studyPack });

  } catch (error) {
    console.error("Generation error:", error);

    res.status(500).json({
      error: "Study pack generation failed. Check your API key and try again."
    });
  }
});

// Serve React application for other frontend routes
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next(err);
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`StudyPack AI server running on port ${port}`);
});
