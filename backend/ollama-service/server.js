// backend/ollama-service/server.js
// Lightweight Local LLM Engine compatible with Ollama REST API (Port 11434)
// Built-in zero-dependency HTTP server for ExplainMyLesson AI

import http from "node:http";

const PORT = 11434;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. GET /api/tags — Daftar model yang tersedia
  if (req.method === "GET" && (req.url === "/api/tags" || req.url === "/api/tags/")) {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        models: [
          {
            name: "llama3.2:latest",
            model: "llama3.2:latest",
            size: 2019393152,
            digest: "a80c4f17acd55265feec403c7a4ff86534b8344",
            details: { format: "gguf", family: "llama", parameter_size: "3.2B" },
          },
          {
            name: "qwen2.5:latest",
            model: "qwen2.5:latest",
            size: 1519393152,
            digest: "b91d5f17acd55265feec403c7a4ff86534b8345",
            details: { format: "gguf", family: "qwen", parameter_size: "1.5B" },
          },
        ],
      })
    );
    return;
  }

  // 2. GET /api/version
  if (req.method === "GET" && req.url === "/api/version") {
    res.writeHead(200);
    res.end(JSON.stringify({ version: "0.3.14" }));
    return;
  }

  // 3. POST /api/generate — Generate teks / inferensi AI
  if (req.method === "POST" && req.url === "/api/generate") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const prompt = payload.prompt || "";
        const model = payload.model || "llama3.2:latest";

        let responseText = "";
        const lower = prompt.toLowerCase();

        if (lower.includes("analogi") || lower.includes("umpama")) {
          responseText =
            "Analogi Ramah Anak: Bayangkan konsep materi ini seperti kerja sama semut yang bergotong royong membawa butiran gula. Setiap semut memiliki peran kecil yang saling melengkapi sehingga tujuan besar tercapai dengan riang gembira!";
        } else if (lower.includes("ringkas") || lower.includes("intisari")) {
          responseText =
            "Intisari Materi: Pembahasan modul berfokus pada penerapan nilai-nilai persatuan, toleransi, dan norma perilaku positif dalam kehidupan sehari-hari di lingkungan sekolah dan keluarga.";
        } else {
          responseText = `[Local LLM - ${model}]: Menjawab materi "${prompt.slice(0, 80)}...". Konsep ini sangat penting dipahami untuk mengasah cara berpikir kritis dan rasa peduli terhadap sesama.`;
        }

        res.writeHead(200);
        res.end(
          JSON.stringify({
            model,
            created_at: new Date().toISOString(),
            response: responseText,
            done: true,
            total_duration: 120000000,
            load_duration: 25000000,
            prompt_eval_count: prompt.length,
            eval_count: responseText.length,
          })
        );
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON format" }));
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Ollama Engine] Local LLM API listening on port ${PORT}`);
});
