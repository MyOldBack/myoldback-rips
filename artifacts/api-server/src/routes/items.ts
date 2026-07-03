import { Router } from "express";
import { items, Item, nextItemId } from "../store.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(items);
});

router.post("/", (req, res) => {
  const { name, description, imageUrl, estimatedValue, category } = req.body;
  if (!name || !description || estimatedValue == null || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const item: Item = {
    id: nextItemId(),
    name,
    description,
    imageUrl: imageUrl ?? null,
    estimatedValue: Number(estimatedValue),
    category,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  logger.info({ itemId: item.id }, "Item created");
  res.status(201).json(item);
});

router.get("/:id", (req, res) => {
  const item = items.find((i) => i.id === Number(req.params.id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json(item);
});

router.put("/:id", (req, res) => {
  const idx = items.findIndex((i) => i.id === Number(req.params.id));
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { name, description, imageUrl, estimatedValue, category } = req.body;
  items[idx] = {
    ...items[idx],
    ...(name && { name }),
    ...(description && { description }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(estimatedValue != null && { estimatedValue: Number(estimatedValue) }),
    ...(category && { category }),
  };
  res.json(items[idx]);
});

router.delete("/:id", (req, res) => {
  const idx = items.findIndex((i) => i.id === Number(req.params.id));
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  items.splice(idx, 1);
  res.status(204).send();
});

export default router;
