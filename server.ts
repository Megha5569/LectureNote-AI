import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

// Increase payload parsing limits for screen captures (base64 pictures)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Google GenAI client to prevent startup crash if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to convert remote image URL to raw base64 string for Gemini inlineData
async function getBase64FromImageUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`Failed to fetch image for Gemini. Status: ${res.status}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (err) {
    console.error("Failed to convert image url to base64:", err);
    return null;
  }
}

// Helper to sleep/delay in milliseconds
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to call Gemini with a layered fallback list to protect against random 503/429 model outages or high demand spikes on specific models.
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const ai = getGenAI();
  // layered fallback order: gemini-3.5-flash -> gemini-3.1-flash-lite
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[LectureNote AI] Attempting content generation with model: "${model}" (Attempt ${attempt}/3)`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          console.log(`[LectureNote AI] Successfully generated content using model: "${model}"`);
          return response;
        }
        throw new Error(`Model "${model}" returned empty response text.`);
      } catch (err: any) {
        console.warn(`[LectureNote AI] Warning: Model "${model}" failed (Attempt ${attempt}/3). Error:`, err?.message || err);
        lastError = err;
        
        // Wait and retry if more attempts are left
        if (attempt < 3) {
          const sleepMs = attempt * 800;
          console.log(`[LectureNote AI] Waiting ${sleepMs}ms before retrying "${model}"...`);
          await delay(sleepMs);
        }
      }
    }
  }

  throw new Error(`All Gemini generative models are currently experiencing extremely high demand. Details: ${lastError?.message || lastError || "Unknown API Connection Failure"}`);
}

// Strictly Typed Schema for robust standard output format
const lectureAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Highly academic, crisp title summarizing the lecture." },
    subject: { type: Type.STRING, description: "Standard academic subject classification (e.g., Computer Science, Biochemistry, Organic Chemistry, Microeconomics)." },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3 to 4 related search terms or tags."
    },
    notes: {
      type: Type.OBJECT,
      properties: {
        topics: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Major sub-topics covered in the session."
        },
        detailedExpl: {
          type: Type.STRING,
          description: "Extremely detailed, multi-paragraph scholarly breakdown explaining the details of all concepts introduced. Ideal for study sessions."
        },
        keyPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "4-6 essential high-yield bullet point lessons."
        },
        definitions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING, description: "Academic term, concept or jargon." },
              definition: { type: Type.STRING, description: "Clear, clean definition of the term." }
            },
            required: ["term", "definition"]
          }
        },
        formulas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the equation, formula, or law." },
              equation: { type: Type.STRING, description: "Precise mathematical, physics, chemistry or logical equation." },
              context: { type: Type.STRING, description: "Short description of what the variables represent and when it is used." }
            },
            required: ["name", "equation"]
          }
        },
        algorithms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the computer science algorithm or chemical process." },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Sequential list of steps."
              }
            },
            required: ["name", "steps"]
          }
        },
        codeSnippets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              language: { type: Type.STRING, description: "Code language, e.g. python, cpp, javascript, typescript, sql, shell" },
              title: { type: Type.STRING, description: "Descriptive title of the code block." },
              code: { type: Type.STRING, description: "Clean code text preserving appropriate programming layout." }
            },
            required: ["language", "title", "code"]
          }
        },
        examples: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING, description: "Topic related to the example." },
              scenario: { type: Type.STRING, description: "The scenario, experiment, design, or conceptual equation." },
              explanation: { type: Type.STRING, description: "Step-by-step walkthrough or explanation." }
            },
            required: ["topic", "scenario", "explanation"]
          }
        },
        actionItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING, description: "Discovered assignment, deadline, reading task, homework, or exam warning." },
              deadline: { type: Type.STRING, description: "Exact date or context described by the professor (optional)." },
              type: { type: Type.STRING, description: "Type of action item (e.g., assignment, deadline, reading, schoolwork)" }
            },
            required: ["task"]
          }
        }
      },
      required: ["topics", "detailedExpl", "keyPoints", "definitions", "formulas", "algorithms", "codeSnippets", "examples", "actionItems"]
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        executive: { type: Type.STRING, description: "High-level summary of the entire video/session." },
        detailed: { type: Type.STRING, description: "Thorough study summary detailing major takeaways." },
        revision: { type: Type.STRING, description: "Revision nodes focusing on exam key-takeaways." },
        onePageReview: { type: Type.STRING, description: "One-page format quick cheat-sheet references." }
      },
      required: ["executive", "detailed", "revision", "onePageReview"]
    },
    quiz: {
      type: Type.OBJECT,
      properties: {
        mcqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answerIndex: { type: Type.INTEGER, description: "Index of correct option in options array (0-based)." },
              explanation: { type: Type.STRING, description: "Thorough verification of why the response is scientifically correct." }
            },
            required: ["question", "options", "answerIndex", "explanation"]
          }
        },
        shortAnswers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING, description: "Standard exemplary response." }
            },
            required: ["question", "answer"]
          }
        },
        interviews: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Tough conceptual oral challenge suitable for technical interviews." },
              idealResponse: { type: Type.STRING, description: "Rich, well-structured multi-bullet conceptual reply." }
            },
            required: ["question", "idealResponse"]
          }
        },
        vivas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Rapid fire question asked by a laboratory external examiner." },
              sampleResponse: { type: Type.STRING, description: "Precise concise viva callback answer." }
            },
            required: ["question", "sampleResponse"]
          }
        }
      },
      required: ["mcqs", "shortAnswers", "interviews", "vivas"]
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Concise recall question for a flashcard study-pile." },
          answer: { type: Type.STRING, description: "High-value compact answer to test retention." }
        },
        required: ["question", "answer"]
      }
    }
  },
  required: ["title", "subject", "tags", "notes", "summary", "quiz", "flashcards"]
};

// System instruction enforcing absolute educational focus and 100% strict privacy/safety
const SYSTEM_INSTRUCTION = `
You are LectureNote AI, an advanced educational AI assistant built to automatically process student lectures.
Your core instruction is to synthesize high-quality study materials, textbook-grade lecture notes, quick cheat-sheets, examinations quizzes, and flashcards.

PRIVACY and SAFETY DIRECTIVES (CRITICAL):
- Never identify participants of the lecture or webinars.
- Never record or attempt to recognize faces or characters from images.
- Never track names, emails, gender, or locations of attendees.
- Never identify who is speaking (do not use speaker identifiers like "Dr. Robert said", "Speaker B says". Instead say: "The instructor explained...", "The lecture notes detail...").
- Focus entirely on the educational content, algorithms, text, definitions, code blocks, slides text, formulas, diagrams, and assignments.
`;

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyConfigured: !!process.env.GEMINI_API_KEY });
});

// Endpoint to analyze captured lecture logs and screenshots
app.post("/api/analyze-lecture", async (req, res) => {
  try {
    const { transcript, slideImages } = req.body;

    if (!transcript && (!slideImages || slideImages.length === 0)) {
      return res.status(400).json({ error: "Missing transcript or slide snapshots for synthesis." });
    }

    const ai = getGenAI();

    // Prepare content parts
    const parts: any[] = [];

    // 1. Add descriptive lecture instructions
    let analysisPrompt = `Generate a complete set of highly polished academic study guides, notes, action items, definitions, formulas, quizzes, and flashcards for this lecture.
Use the supplied lecture transcript text and slide screenshot visuals. Focus purely on educational concepts. Avoid naming specific students or tracking attendees.
If the transcript is sparse, use the slide images to deduce the main core curriculum.`;

    if (transcript) {
      analysisPrompt += `\n\n--- TRANSCRIPT EXCERPT ---\n${transcript}\n--- END TRANSCRIPTION ---`;
    }

    parts.push({ text: analysisPrompt });

    // 2. Add slide image snapshots (limit to maximum 4 slides to conserve payload/tokens)
    if (slideImages && Array.isArray(slideImages)) {
      const selectedSlides = slideImages.slice(0, 4);
      for (const imgItem of selectedSlides) {
        if (typeof imgItem !== "string" || !imgItem.trim()) continue;

        if (imgItem.startsWith("http://") || imgItem.startsWith("https://")) {
          const fetchedBase64 = await getBase64FromImageUrl(imgItem);
          if (fetchedBase64) {
            parts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: fetchedBase64
              }
            });
          }
        } else {
          // Remove data URL scheme prefix if present (e.g. "data:image/jpeg;base64,")
          const cleanBase64 = imgItem.replace(/^data:image\/\w+;base64,/, "");
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          });
        }
      }
    }

    const response = await generateContentWithFallback({
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: lectureAnalysisSchema,
        temperature: 0.2, // lower temperature for high factual recall on notes and formulas
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Error analyzing lecture:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during synthesis."
    });
  }
});

// Helper to fetch YouTube transcript and video title from a given URL
async function fetchYoutubeTranscript(videoUrl: string): Promise<{ transcript: string; title: string } | null> {
  try {
    let videoId = "";
    if (videoUrl.includes("youtu.be/")) {
      videoId = videoUrl.split("youtu.be/")[1]?.split(/[?#]/)[0] || "";
    } else {
      const match = videoUrl.match(/[?&]v=([^&#]*)/);
      videoId = match ? match[1] : "";
    }

    if (!videoId) {
      console.warn("[LectureNote AI] Could not extract YouTube video ID from URL:", videoUrl);
      return null;
    }

    console.log(`[LectureNote AI] Fetching YouTube watch page for Video ID: ${videoId}...`);
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!res.ok) {
      console.warn(`[LectureNote AI] Failed to fetch YouTube watch page. Status: ${res.status}`);
      return null;
    }

    const html = await res.text();

    let title = "";
    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      // Clean up string escape quotes or YouTube tags
      title = titleMatch[1]
        .replace(" - YouTube", "")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .trim();
    }

    const captionTracksMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionTracksMatch) {
      console.warn("[LectureNote AI] No captionTracks found in YouTube HTML page. Captions may be disabled for this video.");
      return { transcript: "", title };
    }

    const tracks = JSON.parse(captionTracksMatch[1]);
    if (!Array.isArray(tracks) || tracks.length === 0) {
      console.warn("[LectureNote AI] captionTracks array is empty.");
      return { transcript: "", title };
    }

    const selectedTrack = tracks.find((t: any) => t.vssId === "en" || t.vssId === ".en") ||
                          tracks.find((t: any) => t.vssId?.startsWith("en") || t.vssId?.startsWith(".en")) ||
                          tracks[0];

    if (!selectedTrack || !selectedTrack.baseUrl) {
      console.warn("[LectureNote AI] No valid caption track base URL found.");
      return { transcript: "", title };
    }

    console.log(`[LectureNote AI] Found caption track: vssId="${selectedTrack.vssId}". Fetching XML transcript...`);
    const xmlRes = await fetch(selectedTrack.baseUrl);
    if (!xmlRes.ok) {
      console.warn(`[LectureNote AI] Failed to fetch caption track XML. Status: ${xmlRes.status}`);
      return { transcript: "", title };
    }

    const xmlText = await xmlRes.text();
    const textSegments: string[] = [];
    const textMatches = Array.from(xmlText.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g));
    
    for (const match of textMatches) {
      let segment = match[1];
      segment = segment
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#10;/g, " ")
        .replace(/&#13;/g, " ")
        .replace(/\s+/g, " ");
      textSegments.push(segment.trim());
    }

    const fullTranscript = textSegments.join(" ");
    console.log(`[LectureNote AI] Successfully parsed YouTube transcript. Length: ${fullTranscript.length} chars.`);
    return { transcript: fullTranscript, title };
  } catch (err) {
    console.error("[LectureNote AI] Error fetching YouTube transcript from page:", err);
    return null;
  }
}

// Endpoint to dynamically generate entire mockup courses of different subjects for Instant play or simulation
app.post("/api/generate-demo-lecture", async (req, res) => {
  try {
    const { subject, topic, link } = req.body;

    if (!subject || !topic) {
      return res.status(400).json({ error: "Please supply both subject and topic." });
    }

    const ai = getGenAI();

    let promptText = "";
    const isYouTube = link && (link.toLowerCase().includes("youtube") || link.toLowerCase().includes("youtu.be"));

    if (isYouTube) {
      console.log(`[LectureNote AI] YouTube Ingress detected: "${link}". Extracting transcript...`);
      const ytResult = await fetchYoutubeTranscript(link);

      if (ytResult && ytResult.transcript) {
        console.log(`[LectureNote AI] Successfully grabbed actual transcript for YouTube video "${ytResult.title || topic}". Feeding to Gemini...`);
        promptText = `
Generate a fully complete, rich standard study guide, highly-detailed lecture notes, comprehensive summaries, action items, quick definitions, formulas/equations, code (if relevant), detailed walk-through examples, and exam questions that directly summarize and detail the educational content of this YouTube Lecture Video:
Subject: "${subject}"
Topic/Title: "${ytResult.title || topic}"
YouTube Ingress URL: "${link}"

--- EXTRACTED ACCURATE VIDEO SUBTITLES/TRANSCRIPT ---
${ytResult.transcript}
--- END TRANSCRIPT ---

Instructions:
Extract and synthesize the core materials, formulas, equations, definitions, and code blocks described in the transcript text level. Deliver precisely what was taught in this YouTube lecture. Include at least 3 formulas/equations, 4 key definitions, 2 code blocks or algorithms corresponding to the transcript content, 3 exam-like MCQ questions, and action items matching any mentioned deadlines or learning tasks.
`;
      } else {
        console.warn(`[LectureNote AI] Could not extract live subtitles for YouTube link "${link}". Falling back to factual static synthesis.`);
        promptText = `
Generate a complete, rich, highly-realistic study guide, detailed notes, comprehensive summaries, action items, quick definitions, formulas, code (if relevant), detailed walk-through examples, and exam questions that accurately summarize and detail the educational content of this YouTube Video/Session:
Subject: "${subject}"
Topic/Title: "${ytResult?.title || topic}"
YouTube Link: "${link}"

Because this is a specific YouTube video session, generate the core materials, formulas, equations, definitions, and code blocks that are factual and exact matches for this academic topic. Deliver precisely what a student would need to prepare for an exam on this session. Include at least 3 formulas/equations, 4 key definitions, 2 code blocks or algorithms, 3 exam-like MCQ questions, and action items.
`;
      }
    } else if (link) {
      promptText = `
Generate a complete, rich, highly-realistic study guide, detailed notes, comprehensive summaries, action items, quick definitions, formulas, code (if relevant), detailed walk-through examples, and exam questions that accurately summarize and detail the educational content of this Web Seminar/Classroom Link:
Subject: "${subject}"
Topic/Title: "${topic}"
Shared Ingress Link/ID: "${link}"

Ensure the generated study guide factually expands upon the core subject. Deliver precisely what a student would expect to be delivered in this class session. Include at least 3 formulas/equations, 4 key definitions, 2 code blocks or algorithms, 3 exam-like MCQ questions, and action items.
`;
    } else {
      promptText = `
Generate a complete, rich mock study guide, detailed notes, comprehensive summaries, action items, quick definitions, related formulas, code (if relevant), detailed walk-through examples, and exams questions for a stellar lecture on:
Subject: "${subject}"
Topic: "${topic}"

Provide dynamic, highly descriptive academic explanation text as if captured during an intense 60-minute university level symposium. Include at least 3 formulas/equations, 4 key definitions, 2 code blocks/algorithms (if applicable to the domain, otherwise high level academic processes), 3 exam-like MCQ questions, and action items with realistic mid-term dates.
`;
    }

    const response = await generateContentWithFallback({
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: lectureAnalysisSchema,
        temperature: 0.7,
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Error generating demo lecture:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred synthesizing your demo."
    });
  }
});

async function startServer() {
  // Setup Vite Dev Server / Static Ingress
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LectureNote AI fullstack server successfully running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
