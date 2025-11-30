import fetch from "node-fetch";

const owner = "minh597";
const repo = "Aiai";
const filePath = "data/products.json";
const token = process.env.GITHUB_TOKEN;

async function getFile() {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

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

  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Update products.json",
      content: contentBase64,
      sha: sha
    })
  });
}

export default async function handler(req, res) {
  let { method } = req;

  // Load file từ GitHub
  const { sha, json } = await getFile();
  let items = json;

  // GET
  if (method === "GET") {
    return res.status(200).json(items);
  }

  // POST – Thêm item
  if (method === "POST") {
    const { name, price } = req.body;

    const newItem = {
      id: Date.now(),
      name,
      price
    };

    items.push(newItem);
    await updateFile(items, sha);

    return res.status(201).json(newItem);
  }

  // PUT – Update item
  if (method === "PUT") {
    const { id, name, price } = req.body;

    const index = items.findIndex(x => x.id == id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    items[index] = { id, name, price };
    await updateFile(items, sha);

    return res.status(200).json(items[index]);
  }

  // DELETE – Xoá item
  if (method === "DELETE") {
    const { id } = req.body;

    const newItems = items.filter(x => x.id != id);
    await updateFile(newItems, sha);

    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
