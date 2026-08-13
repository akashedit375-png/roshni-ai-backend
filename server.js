const http = require("http");

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const data = JSON.parse(body);
      const message = String(data.message || "").trim();

      if (!message) {
        res.writeHead(400);
        return res.end(JSON.stringify({
          error: "Message is required"
        }));
      }

      if (!GEMINI_API_KEY) {
        res.writeHead(500);
        return res.end(JSON.stringify({
          error: "GEMINI_API_KEY is not configured"
        }));
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "You are Roshni AI, a friendly and helpful Bengali AI assistant. Reply naturally and clearly."
                }
              ]
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: message
                  }
                ]
              }
            ]
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        res.writeHead(response.status);
        return res.end(JSON.stringify({
          error: result
        }));
      }

      const reply =
        result.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("") ||
        "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।";

      res.writeHead(200);
      res.end(JSON.stringify({ reply }));

    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({
        error: error.message
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Roshni AI backend running on port ${PORT}`);
});
