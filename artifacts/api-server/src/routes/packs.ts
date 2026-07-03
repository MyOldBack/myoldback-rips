import { Router } from "express";
import { packs, Pack, nextPackId } from "../store.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(packs);
});

router.post("/", (req, res) => {
  const { name, spotCount, price, isActive } = req.body;
  if (!name || !spotCount || price == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const singlePrice = price / spotCount;
  const basePrice = singlePrice * spotCount;
  const discount = Math.round(((basePrice - price) / basePrice) * 100);

  const pack: Pack = {
    id: nextPackId(),
    name,
    spotCount: Number(spotCount),
    price: Number(price),
    discount: Math.max(0, discount),
    isActive: isActive ?? true,
    createdAt: new Date().toISOString(),
  };
  packs.push(pack);
  logger.info({ packId: pack.id }, "Pack created");
  res.status(201).json(pack);
});

router.put("/:id", (req, res) => {
  const idx = packs.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { name, spotCount, price, isActive } = req.body;
  const sp = spotCount != null ? Number(spotCount) : packs[idx].spotCount;
  const pr = price != null ? Number(price) : packs[idx].price;
  const singlePrice = pr / sp;
  const discount = Math.round(((singlePrice * sp - pr) / (singlePrice * sp)) * 100);

  packs[idx] = {
    ...packs[idx],
    ...(name && { name }),
    ...(spotCount != null && { spotCount: sp }),
    ...(price != null && { price: pr }),
    discount: Math.max(0, discount),
    ...(isActive !== undefined && { isActive }),
  };
  res.json(packs[idx]);
});

router.delete("/:id", (req, res) => {
  const idx = packs.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  packs.splice(idx, 1);
  res.status(204).send();
});

export default router;
