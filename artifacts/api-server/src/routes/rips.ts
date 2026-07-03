import { Router } from "express";
import { rips, Rip, spots, items, nextRipId } from "../store.js";
import { logger } from "../lib/logger.js";

const router = Router();

function buildRip(rip: Rip) {
  const item = items.find((i) => i.id === rip.itemId);
  const ripSpots = spots.filter((s) => s.ripId === rip.id);
  return {
    ...rip,
    itemName: item?.name ?? "Unknown",
    itemImageUrl: item?.imageUrl ?? null,
    itemEstimatedValue: item?.estimatedValue ?? 0,
    spotsSold: ripSpots.length,
  };
}

router.get("/", (req, res) => {
  const { status } = req.query;
  const filtered = status
    ? rips.filter((r) => r.status === status)
    : rips;
  res.json(filtered.map(buildRip));
});

router.post("/", (req, res) => {
  const { itemId, spotCount, spotPrice, status } = req.body;
  if (!itemId || !spotCount || spotPrice == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const item = items.find((i) => i.id === Number(itemId));
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }

  const rip: Rip = {
    id: nextRipId(),
    itemId: Number(itemId),
    spotCount: Number(spotCount),
    spotPrice: Number(spotPrice),
    status: status ?? "pending",
    winnerName: null,
    winnerSlot: null,
    createdAt: new Date().toISOString(),
  };
  rips.push(rip);
  logger.info({ ripId: rip.id }, "Rip created");
  res.status(201).json(buildRip(rip));
});

router.get("/:id", (req, res) => {
  const rip = rips.find((r) => r.id === Number(req.params.id));
  if (!rip) { res.status(404).json({ error: "Not found" }); return; }
  const item = items.find((i) => i.id === rip.itemId);
  const ripSpots = spots.filter((s) => s.ripId === rip.id);
  res.json({
    ...rip,
    itemName: item?.name ?? "Unknown",
    itemImageUrl: item?.imageUrl ?? null,
    itemEstimatedValue: item?.estimatedValue ?? 0,
    itemCategory: item?.category ?? "",
    itemDescription: item?.description ?? "",
    spotsSold: ripSpots.length,
    spots: ripSpots.map((s) => ({
      ...s,
      isWinner: rip.winnerSlot === s.slotNumber,
    })),
  });
});

router.put("/:id", (req, res) => {
  const idx = rips.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const { itemId, spotCount, spotPrice, status } = req.body;
  if (itemId != null) {
    const item = items.find((i) => i.id === Number(itemId));
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  }
  rips[idx] = {
    ...rips[idx],
    ...(itemId != null && { itemId: Number(itemId) }),
    ...(spotCount != null && { spotCount: Number(spotCount) }),
    ...(spotPrice != null && { spotPrice: Number(spotPrice) }),
    ...(status && { status }),
  };
  res.json(buildRip(rips[idx]));
});

router.delete("/:id", (req, res) => {
  const idx = rips.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }
  rips.splice(idx, 1);
  res.status(204).send();
});

router.post("/:id/spin", (req, res) => {
  const ripIdx = rips.findIndex((r) => r.id === Number(req.params.id));
  if (ripIdx === -1) { res.status(404).json({ error: "Not found" }); return; }
  const rip = rips[ripIdx];

  const ripSpots = spots.filter((s) => s.ripId === rip.id);
  if (ripSpots.length === 0) {
    res.status(400).json({ error: "No spots purchased yet" });
    return;
  }

  const winnerIdx = Math.floor(Math.random() * ripSpots.length);
  const winner = ripSpots[winnerIdx];

  rips[ripIdx] = {
    ...rip,
    status: "completed",
    winnerName: winner.userName,
    winnerSlot: winner.slotNumber,
  };

  const allSlots = ripSpots.map((s) => s.userName);

  logger.info({ ripId: rip.id, winner: winner.userName }, "Spin completed");
  res.json({
    ripId: rip.id,
    winnerSlot: winner.slotNumber,
    winnerName: winner.userName,
    allSlots,
  });
});

export default router;
