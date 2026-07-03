import { Router } from "express";
import { cards, Card, items, rips, nextCardId } from "../store.js";
import { logger } from "../lib/logger.js";

const router = Router({ mergeParams: true });

function makeCard(body: Record<string, unknown>, itemId: number | null, ripId: number | null): Card {
  return {
    id: nextCardId(),
    playerName: String(body.playerName ?? ""),
    year: String(body.year ?? ""),
    set: String(body.set ?? ""),
    cardNumber: String(body.cardNumber ?? ""),
    description: String(body.description ?? ""),
    rarity: (body.rarity as Card["rarity"]) ?? "common",
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    itemId,
    ripId,
    createdAt: new Date().toISOString(),
  };
}

// ── Item cards ────────────────────────────────────────────────────────────────

export const itemCardsRouter = Router({ mergeParams: true });

itemCardsRouter.get("/", (req, res) => {
  const itemId = Number(req.params.id);
  const item = items.find((i) => i.id === itemId);
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  res.json(cards.filter((c) => c.itemId === itemId));
});

itemCardsRouter.post("/", (req, res) => {
  const itemId = Number(req.params.id);
  const item = items.find((i) => i.id === itemId);
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  const { playerName, year, set, cardNumber, description, rarity } = req.body;
  if (!playerName || !year || !set || !cardNumber || !description || !rarity) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const card = makeCard(req.body, itemId, null);
  cards.push(card);
  logger.info({ cardId: card.id, itemId }, "Item card added");
  res.status(201).json(card);
});

itemCardsRouter.delete("/:cardId", (req, res) => {
  const itemId = Number(req.params.id);
  const cardId = Number(req.params.cardId);
  const idx = cards.findIndex((c) => c.id === cardId && c.itemId === itemId);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  cards.splice(idx, 1);
  res.status(204).send();
});

// ── Rip cards ─────────────────────────────────────────────────────────────────

export const ripCardsRouter = Router({ mergeParams: true });

ripCardsRouter.get("/", (req, res) => {
  const ripId = Number(req.params.id);
  const rip = rips.find((r) => r.id === ripId);
  if (!rip) { res.status(404).json({ error: "Rip not found" }); return; }
  res.json(cards.filter((c) => c.ripId === ripId));
});

ripCardsRouter.post("/", (req, res) => {
  const ripId = Number(req.params.id);
  const rip = rips.find((r) => r.id === ripId);
  if (!rip) { res.status(404).json({ error: "Rip not found" }); return; }
  const { playerName, year, set, cardNumber, description, rarity } = req.body;
  if (!playerName || !year || !set || !cardNumber || !description || !rarity) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const card = makeCard(req.body, null, ripId);
  cards.push(card);
  logger.info({ cardId: card.id, ripId }, "Rip card added");
  res.status(201).json(card);
});

ripCardsRouter.delete("/:cardId", (req, res) => {
  const ripId = Number(req.params.id);
  const cardId = Number(req.params.cardId);
  const idx = cards.findIndex((c) => c.id === cardId && c.ripId === ripId);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  cards.splice(idx, 1);
  res.status(204).send();
});

export default router;
