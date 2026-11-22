import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "StudyPack AI server is running." });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { notes, subject, difficulty } = req.body ?? {};
    if (typeof notes !== "string" || notes.trim().length < 30) {
      return res.status(400).json({ error: "Please provide at least 30 characters of lecture notes." });
    }
    if (notes.length > 60000) {
      return res.status(400).json({ error: "Please keep your notes under 60,000 characters." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing. Add it to server/.env and restart the server." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt
    });
    const studyPack = response.text?.trim();
    if (!studyPack) return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    res.json({ studyPack });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Study pack generation failed. Check your API key, internet connection, and try again." });
  }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`StudyPack AI API running at http://localhost:${port}`));
