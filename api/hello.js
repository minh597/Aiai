export default function handler(req, res) {
  return res.status(200).json({
    message: "Hello từ API Vercel!",
    method: req.method,
    time: Date.now()
  });
}
