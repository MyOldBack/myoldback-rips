import { Router } from "express";
import { spots, rips, Spot, nextSpotId } from "../store.js";
import { logger } from "../lib/logger.js";

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  const ripId = Number(req.params.id);
  const rip = rips.find((r) => r.id === ripId);
  if (!rip) { res.status(404).json({ error: "Rip not found" }); return; }

  const ripSpots = spots.filter((s) => s.ripId === ripId);
  res.json(
    ripSpots.map((s) => ({
      ...s,
      isWinner: rip.winnerSlot === s.slotNumber,
    }))
  );
});

router.post("/", (req, res) => {
  const ripId = Number(req.params.id);
  const rip = rips.find((r) => r.id === ripId);
  if (!rip) { res.status(404).json({ error: "Rip not found" }); return; }
  if (rip.status === "completed" || rip.status === "spinning") {
    res.status(400).json({ error: "Rip is no longer accepting spots" });
    return;
  }

  const { userName, quantity } = req.body;
  if (!userName || !quantity) {
    res.status(400).json({ error: "userName and quantity are required" });
    return;
  }

  const qty = Number(quantity);
  const existingSpots = spots.filter((s) => s.ripId === ripId);
  const availableSlots = rip.spotCount - existingSpots.length;

  if (qty > availableSlots) {
    res.status(400).json({ error: `Only ${availableSlots} spots remaining` });
    return;
  }

  const usedSlots = new Set(existingSpots.map((s) => s.slotNumber));
  const newSpots: Spot[] = [];
  let slotNum = 1;
  for (let i = 0; i < qty; i++) {
    while (usedSlots.has(slotNum)) slotNum++;
    const spot: Spot = {
      id: nextSpotId(),
      ripId,
      userName,
      slotNumber: slotNum,
      purchasedAt: new Date().toISOString(),
    };
    newSpots.push(spot);
    spots.push(spot);
    usedSlots.add(slotNum);
    slotNum++;
  }

  logger.info({ ripId, userName, qty }, "Spots purchased");
  res.status(201).json(
    newSpots.map((s) => ({ ...s, isWinner: false }))
  );
});

export default router;
