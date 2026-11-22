import React, { useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { jsPDF } from "jspdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const sampleNotes = `Tokenization is the process of breaking text into smaller units called tokens. Tokens can be words, characters or subwords. Stemming reduces words to their root form by removing prefixes or suffixes. Lemmatization converts words into their meaningful dictionary base form. Stop words are common words such as the, is and are that may be removed during text preprocessing.`;

export default function App() {
  const [subject, setSubject] = useState("Natural Language Processing");
  const [difficulty, setDifficulty] = useState("Easy");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [studyPack, setStudyPack] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const wordCount = useMemo(() => notes.trim() ? notes.trim().split(/\s+/).length : 0, [notes]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setFileName(file.name);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Please choose a file smaller than 10 MB.");
      if (file.name.toLowerCase().endsWith(".txt")) setNotes(await file.text());
      else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        let extracted = "";
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const content = await page.getTextContent();
          extracted += content.items.map(item => item.str).join(" ") + "\n";
        }
        if (!extracted.trim()) throw new Error("No selectable text found. This may be a scanned PDF; paste its text instead.");
        setNotes(extracted);
      } else throw new Error("Only PDF and TXT files are supported.");
    } catch (e) { setError(e.message || "Could not read this file."); setFileName(""); }
    event.target.value = "";
  }

  async function generate() {
    setError(""); setStudyPack("");
    if (notes.trim().length < 30) { setError("Please provide lecture notes containing at least 30 characters."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, subject, difficulty })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setStudyPack(data.studyPack);
    } catch (e) { setError(e.message || "Could not connect. Make sure the backend is running."); }
    finally { setLoading(false); }
  }

  async function copyPack() {
    try { await navigator.clipboard.writeText(studyPack); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setError("Copy was blocked. You can select and copy the text manually."); }
  }

  function downloadPdf() {
    if (!studyPack) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 16, width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight();
    const lines = doc.splitTextToSize(studyPack, width - margin * 2);
    let y = 18; doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    for (const line of lines) { if (y > height - 16) { doc.addPage(); y = 18; } doc.text(line, margin, y); y += 5; }
    doc.save("StudyPack_AI_Study_Guide.pdf");
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">S</span><span>StudyPack <b>AI</b></span></a><span className="team-pill">A Ghosting Paradox project</span></header>
    <main>
      <section className="hero"><div className="eyebrow">✦ YOUR PERSONAL AI STUDY ASSISTANT</div><h1>From lecture notes<br/><span>to study-ready.</span></h1><p>Turn long notes into clear summaries, key concepts and practice questions — all in one place.</p><div className="hero-tags"><span>✧ Simple explanations</span><span>✧ Exam practice</span><span>✧ Note-based answers</span></div></section>
      <section className="workspace">
        <div className="input-card">
          <div className="section-heading"><div><div className="step-label">STEP 01</div><h2>Add your lecture notes</h2><p>Paste your notes or upload a PDF / TXT file.</p></div><span className="number-bubble">01</span></div>
          <div className="field-row">
            <label className="field">Subject<input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Natural Language Processing" maxLength={100}/></label>
            <label className="field">Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
          </div>
          <label className="field notes-label">Lecture notes<textarea value={notes} onChange={e=>{setNotes(e.target.value);setFileName("");}} placeholder="Paste your lecture notes here..." rows="9"/></label>
          <div className="notes-footer"><span>{wordCount} words {fileName ? `· ${fileName}` : ""}</span><label className="upload-btn">＋ Upload PDF / TXT<input type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={handleFile}/></label></div>
          <div className="sample-row"><button className="text-btn" onClick={()=>{setNotes(sampleNotes);setSubject("Natural Language Processing");setDifficulty("Easy");setFileName("Sample notes");}}>Try sample notes</button><button className="text-btn" onClick={()=>{setNotes("");setFileName("");setError("");}}>Clear notes</button></div>
          {error && <div className="error-box" role="alert">{error}</div>}
          <button className="generate-btn" onClick={generate} disabled={loading}>{loading ? <><span className="spinner"/> Creating your study pack...</> : <>Generate my study pack <span>→</span></>}</button>
          <p className="privacy-note">✦ Notes are sent to Gemini for generation. Avoid uploading private or confidential material.</p>
        </div>
        <div className="output-card">
          <div className="section-heading"><div><div className="step-label">STEP 02</div><h2>Your study pack</h2><p>Your revision material will appear here.</p></div><span className="number-bubble lavender">02</span></div>
          {!studyPack && !loading && <div className="empty-state"><div className="empty-icon">✧</div><h3>Your study space is ready</h3><p>Add lecture notes and generate your first study pack. Your summary, concepts and questions will appear here.</p><div className="preview-chips"><span>Chapter summary</span><span>Key concepts</span><span>Practice Q&amp;A</span></div></div>}
          {loading && <div className="loading-state"><span className="big-spinner"/><h3>Reading your notes...</h3><p>Organising the important ideas into a study pack.</p></div>}
          {studyPack && <div className="result-area"><div className="result-toolbar"><span className="ready-label">✓ STUDY PACK GENERATED</span><div><button className="small-btn" onClick={copyPack}>{copied ? "Copied!" : "Copy"}</button><button className="small-btn primary-small" onClick={downloadPdf}>↓ Download PDF</button></div></div><pre className="study-output">{studyPack}</pre></div>}
        </div>
      </section>
      <section className="how-section"><div className="eyebrow">MADE FOR BETTER REVISION</div><h2>Less time organising.<br/><span>More time understanding.</span></h2><div className="feature-grid">
        <article><div className="feature-icon blue">✎</div><h3>Clear summaries</h3><p>Get the main ideas in simple, readable language.</p></article>
        <article><div className="feature-icon purple">◇</div><h3>Concept clarity</h3><p>Review important topics and terminology.</p></article>
        <article><div className="feature-icon peach">✦</div><h3>Practice smarter</h3><p>Test your understanding with questions and answers.</p></article>
      </div></section>
    </main>
    <footer><span>StudyPack AI</span><span>Built by <b>GHOSTING PARADOX</b> · Problem C2</span></footer>
  </div>;
}
