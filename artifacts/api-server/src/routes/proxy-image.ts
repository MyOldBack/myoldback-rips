import { Router } from "express";

const router = Router();

router.get("/proxy-image", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CardRips/1.0)" },
    });

    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const buf = await upstream.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch {
    res.status(502).json({ error: "Failed to fetch image" });
  }
});

export default router;
