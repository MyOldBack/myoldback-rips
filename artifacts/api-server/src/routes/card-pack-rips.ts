import { Router } from "express";
import {
  cardPackRipEntries,
  cardPackRips,
  items,
  nextCardPackRipEntryId,
  nextCardPackRipId,
  type Rarity,
} from "../store.js";

const router = Router();

function buildPackRip(packRip: (typeof cardPackRips)[number]) {
  const entries = cardPackRipEntries
    .filter((e) => e.cardPackRipId === packRip.id)
    .map((e) => {
      const item = items.find((i) => i.id === e.itemId);
      return {
        id: e.id,
        itemId: e.itemId,
        itemName: item?.name ?? "Unknown",
        itemImageUrl: item?.imageUrl ?? null,
        itemEstimatedValue: item?.estimatedValue ?? 0,
        itemCategory: item?.category ?? "",
        weight: e.weight,
        rarity: e.rarity,
      };
    });
  return { ...packRip, entries };
}

router.get("/", (_req, res) => {
  res.json(cardPackRips.map(buildPackRip));
});

router.post("/", (req, res) => {
  const { name, description, price, isActive, entries } = req.body as {
    name: string;
    description: string;
    price: number;
    isActive: boolean;
    entries: { itemId: number; weight: number; rarity: Rarity }[];
  };
  const newPack = {
    id: nextCardPackRipId(),
    name,
    description,
    price,
    isActive,
    totalOpened: 0,
    createdAt: new Date().toISOString(),
  };
  cardPackRips.push(newPack);
  for (const e of entries) {
    cardPackRipEntries.push({
      id: nextCardPackRipEntryId(),
      cardPackRipId: newPack.id,
      itemId: e.itemId,
      weight: e.weight,
      rarity: e.rarity,
    });
  }
  res.status(201).json(buildPackRip(newPack));
});

router.get("/:id", (req, res) => {
  const pack = cardPackRips.find((p) => p.id === Number(req.params.id));
  if (!pack) return res.status(404).json({ error: "Not found" });
  res.json(buildPackRip(pack));
});

router.put("/:id", (req, res) => {
  const pack = cardPackRips.find((p) => p.id === Number(req.params.id));
  if (!pack) return res.status(404).json({ error: "Not found" });
  const { name, description, price, isActive } = req.body as {
    name?: string;
    description?: string;
    price?: number;
    isActive?: boolean;
  };
  if (name !== undefined) pack.name = name;
  if (description !== undefined) pack.description = description;
  if (price !== undefined) pack.price = price;
  if (isActive !== undefined) pack.isActive = isActive;
  res.json(buildPackRip(pack));
});

router.delete("/:id", (req, res) => {
  const idx = cardPackRips.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  cardPackRips.splice(idx, 1);
  const entryIdxs = cardPackRipEntries
    .map((e, i) => (e.cardPackRipId === Number(req.params.id) ? i : -1))
    .filter((i) => i >= 0)
    .reverse();
  for (const i of entryIdxs) cardPackRipEntries.splice(i, 1);
  res.status(204).send();
});

router.post("/:id/open", (req, res) => {
  const pack = cardPackRips.find((p) => p.id === Number(req.params.id));
  if (!pack) return res.status(404).json({ error: "Not found" });
  if (!pack.isActive) return res.status(400).json({ error: "Pack is not active" });

  const { userName } = req.body as { userName: string };
  const entries = cardPackRipEntries.filter((e) => e.cardPackRipId === pack.id);
  if (entries.length === 0) return res.status(400).json({ error: "No entries in pack" });

  // Weighted random selection
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * totalWeight;
  let hit = entries[entries.length - 1];
  for (const entry of entries) {
    rand -= entry.weight;
    if (rand <= 0) {
      hit = entry;
      break;
    }
  }

  pack.totalOpened += 1;

  const item = items.find((i) => i.id === hit.itemId)!;
  res.json({
    cardPackRipId: pack.id,
    userName,
    hitItemId: hit.itemId,
    hitItemName: item.name,
    hitItemImageUrl: item.imageUrl,
    hitItemEstimatedValue: item.estimatedValue,
    hitItemCategory: item.category,
    hitRarity: hit.rarity,
    openedAt: new Date().toISOString(),
  });
});

export default router;
