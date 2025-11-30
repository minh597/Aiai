import fetch from "node-fetch";

const owner = "minh597";
const repo = "Aiai";
const filePath = "data/products.json";
const token = process.env.GITHUB_TOKEN;

// Cache để tránh race condition
let updateLock = false;

async function getFile() {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const res = await fetch(url, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    timeout: 5000 // 5s timeout
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET failed: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");

  return {
    sha: data.sha,
    json: JSON.parse(content)
  };
}

async function updateFile(newJson, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const contentBase64 = Buffer.from(JSON.stringify(newJson, null, 2)).toString("base64");

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message: "Update products.json",
      content: contentBase64,
      sha: sha
    }),
    timeout: 5000
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT failed: ${res.status} - ${text}`);
  }

  return res.json();
}

export default async function handler(req, res) {
  // Set timeout cho serverless function
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const { method } = req;

    // Kiểm tra token
    if (!token) {
      return res.status(500).json({ error: "GITHUB_TOKEN not configured" });
    }

    // GET - không cần lock
    if (method === "GET") {
      const { json } = await getFile();
      return res.status(200).json(json);
    }

    // Check lock để tránh race condition
    if (updateLock) {
      return res.status(429).json({ error: "Too many requests, try again" });
    }

    updateLock = true;

    try {
      // Luôn load file mới trước khi update
      const { sha, json: items } = await getFile();

      // POST
      if (method === "POST") {
        const { name, price } = req.body;

        if (!name || !price) {
          return res.status(400).json({ error: "Missing name or price" });
        }

        const newItem = {
          id: Date.now(),
          name,
          price: parseFloat(price)
        };

        items.push(newItem);
        await updateFile(items, sha);

        return res.status(201).json(newItem);
      }

      // PUT
      if (method === "PUT") {
        const { id, name, price } = req.body;

        if (!id) {
          return res.status(400).json({ error: "Missing id" });
        }

        const index = items.findIndex(x => x.id == id);
        if (index === -1) {
          return res.status(404).json({ error: "Not found" });
        }

        items[index] = { 
          id: parseInt(id), 
          name: name || items[index].name, 
          price: price ? parseFloat(price) : items[index].price 
        };
        
        await updateFile(items, sha);

        return res.status(200).json(items[index]);
      }

      // DELETE
      if (method === "DELETE") {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ error: "Missing id" });
        }

        const newItems = items.filter(x => x.id != id);
        
        if (newItems.length === items.length) {
          return res.status(404).json({ error: "Item not found" });
        }

        await updateFile(newItems, sha);

        return res.status(200).json({ message: "Deleted", id });
      }

      return res.status(405).json({ error: "Method not allowed" });

    } finally {
      updateLock = false;
    }

  } catch (error) {
    updateLock = false;
    console.error("Handler error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}

// Config cho Vercel
export const config = {
  maxDuration: 10, // 10s timeout
};
