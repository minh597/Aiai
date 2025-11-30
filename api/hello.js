let items = []; // Lưu data tạm trong RAM
const API_KEY = "minh123"; // API key của bạn

export default function handler(req, res) {
  const key = req.headers["x-api-key"] || req.query.apikey; // Check header hoặc query

  // Kiểm tra API key
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  const { method } = req;

  // ================== GET ==================
  // Lấy danh sách items
  if (method === "GET") {
    return res.status(200).json({ items });
  }

  // ================== POST ==================
  // Thêm item mới
  if (method === "POST") {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }

    const newItem = {
      id: items.length + 1,
      name,
    };

    items.push(newItem);

    return res.status(201).json({ message: "Added", item: newItem });
  }

  // ================== DELETE ==================
  // Xóa item theo id
  if (method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing item id" });
    }

    const index = items.findIndex(i => i.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Item not found" });
    }

    const deleted = items.splice(index, 1);

    return res.status(200).json({ message: "Deleted", item: deleted[0] });
  }

  // Method khác → không cho
  return res.status(405).json({ error: "Method not allowed" });
}
