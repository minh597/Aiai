const API_KEY = "minh123";

export default function handler(req, res) {
  const key = req.headers["x-api-key"];

  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  const { method } = req;

  if (method === "GET") {
    return res.status(200).json({ message: "Hello from Vercel API with key!" });
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
