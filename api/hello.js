import fetch from "node-fetch"; // Nếu Node <18, Node 18+ không cần import

const API_KEY = "minh123";
const REPO = "minh597/Aiai"; // thay bằng repo GitHub của bạn
const FILE_PATH = "items.json";
const BRANCH = "main";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  try {
    const key = req.headers["x-api-key"] || req.query.apikey;
    if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });

    const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${FILE_PATH}`;

    // Lấy file hiện tại từ GitHub
    let content = [];
    let sha = null;
    try {
      const fileRes = await fetch(API_URL, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
      });
      if (fileRes.status === 200) {
        const fileData = await fileRes.json();
        sha = fileData.sha;
        content = JSON.parse(Buffer.from(fileData.content, "base64").toString());
      }
    } catch (e) {
      content = [];
      sha = null;
    }

    // ================== GET ==================
    if (req.method === "GET") {
      return res.status(200).json({ items: content });
    }

    // ================== POST ==================
    if (req.method === "POST") {
      const { name, quantity, price, description, image } = req.body;
      if (!name || quantity == null || price == null)
        return res.status(400).json({ error: "Missing required fields" });

      const newItem = {
        id: content.length + 1,
        name,
        quantity,
        price,
        description: description || "",
        image: image || ""
      };
      content.push(newItem);

      // Force upload lên GitHub
      await fetch(API_URL, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Force add item ${newItem.id}`,
          content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
          sha: sha,
          branch: BRANCH
        })
      });

      return res.status(201).json({ message: "Added (force)", item: newItem });
    }

    // ================== DELETE ==================
    if (req.method === "DELETE") {
      const { id } = req.body;

      if (id != null) {
        content = content.filter(i => i.id !== id);
      } else {
        content = [];
      }

      await fetch(API_URL, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: id ? `Force delete item ${id}` : "Force delete all items",
          content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
          sha: sha,
          branch: BRANCH
        })
      });

      return res.status(200).json({ message: "Deleted (force)" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Function error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
