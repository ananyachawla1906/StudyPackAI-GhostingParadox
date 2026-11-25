
let response;

for (let attempt = 0; attempt < 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt
    });

    if (!response?.text?.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

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

    console.log(`Gemini retry ${attempt + 1}/2 after error ${status}`);

    await new Promise(resolve =>
      setTimeout(resolve, 2000 * (2 ** attempt))
    );
  }
}

const studyPack = response?.text?.trim() || "";
