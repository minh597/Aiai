let products = []; // Dữ liệu tạm thời lưu trong RAM

const API_KEY = "minh123"; // Thay bằng key của bạn

export default function handler(req, res) {
  const key = req.headers["x-api-key"];

  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  const { method } = req;

  if (method === "GET") {
    // Lấy danh sách sản phẩm
    return res.status(200).json({ products });
  } 
  else if (method === "POST") {
    // Thêm sản phẩm mới
    const { name, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Missing name or price" });
    }
    const newProduct = { id: products.length + 1, name, price };
    products.push(newProduct);
    return res.status(201).json({ message: "Product added", product: newProduct });
  } 
  else if (method === "DELETE") {
    // Xóa sản phẩm theo id
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing product id" });

    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Product not found" });

    const deleted = products.splice(index, 1);
    return res.status(200).json({ message: "Product deleted", product: deleted[0] });
  } 
  else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
