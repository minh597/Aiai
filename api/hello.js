let items = []; // Lưu data tạm trong RAM
const API_KEY = "minh123";

export default function handler(req, res) {
  const key = req.headers["x-api-key"] || req.query.apikey;

  // Kiểm tra API key
  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  const { method } = req;

  // ================== GET ==================
  if (method === "GET") {
    return res.status(200).json({ items });
  }

  // ================== POST ==================
  if (method === "POST") {
    const { name, quantity, price, description, image } = req.body;

    if (!name || quantity == null || price == null) {
      return res.status(400).json({ error: "Missing required fields (name, quantity, price)" });
    }

    const newItem = {
      id: items.length + 1,
      name,
      quantity,
      price,
      description: description || "",
      image: image || ""
    };

    items.push(newItem);

    return res.status(201).json({ message: "Added", item: newItem });
  }

  // ================== DELETE ==================
  if (method === "DELETE") {
    const { id } = req.body;

    if (id != null) {
      // Xoá theo id
      const index = items.findIndex(i => i.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Item not found" });
      }
      const deleted = items.splice(index, 1);
      return res.status(200).json({ message: "Deleted", item: deleted[0] });
    } else {
      // Xoá tất cả
      items = [];
      return res.status(200).json({ message: "All items deleted" });
    }
  }

  // Method khác → không cho
  return res.status(405).json({ error: "Method not allowed" });
}
