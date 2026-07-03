import { Router } from "express";
import {
  instaRips,
  instaRipCards,
  nextInstaRipId,
  nextInstaRipCardId,
  type InstaRarity,
} from "../store.js";

const router = Router();

function proxyUrl(baseUrl: string, imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
}

function withCards(rip: (typeof instaRips)[number], baseUrl: string) {
  return {
    ...rip,
    cards: instaRipCards
      .filter((c) => c.instaRipId === rip.id)
      .map((c) => ({ ...c, imageUrl: proxyUrl(baseUrl, c.imageUrl) })),
  };
}

function getBase(req: import("express").Request): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

router.get("/insta-rips", (req, res) => {
  const base = getBase(req);
  res.json(instaRips.map((r) => withCards(r, base)));
});

router.get("/insta-rips/:id", (req, res) => {
  const rip = instaRips.find((r) => r.id === Number(req.params.id));
  if (!rip) return res.status(404).json({ error: "Not found" });
  return res.json(withCards(rip, getBase(req)));
});

router.post("/insta-rips", (req, res) => {
  const { name, description, cost, isActive, commonOdds, rareOdds, chaseOdds } =
    req.body;
  const total = (commonOdds ?? 0) + (rareOdds ?? 0) + (chaseOdds ?? 0);
  if (total !== 100) {
    return res.status(400).json({ error: "Odds must sum to 100" });
  }
  const rip = {
    id: nextInstaRipId(),
    name,
    description: description ?? "",
    cost: Number(cost),
    isActive: isActive ?? true,
    commonOdds: Number(commonOdds),
    rareOdds: Number(rareOdds),
    chaseOdds: Number(chaseOdds),
    totalOpened: 0,
    createdAt: new Date().toISOString(),
  };
  instaRips.push(rip);
  return res.status(201).json(withCards(rip, getBase(req)));
});

router.put("/insta-rips/:id", (req, res) => {
  const idx = instaRips.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const { name, description, cost, isActive, commonOdds, rareOdds, chaseOdds } =
    req.body;
  const total = (commonOdds ?? 0) + (rareOdds ?? 0) + (chaseOdds ?? 0);
  if (total !== 100) {
    return res.status(400).json({ error: "Odds must sum to 100" });
  }
  instaRips[idx] = {
    ...instaRips[idx],
    name: name ?? instaRips[idx].name,
    description: description ?? instaRips[idx].description,
    cost: cost !== undefined ? Number(cost) : instaRips[idx].cost,
    isActive: isActive ?? instaRips[idx].isActive,
    commonOdds: commonOdds !== undefined ? Number(commonOdds) : instaRips[idx].commonOdds,
    rareOdds: rareOdds !== undefined ? Number(rareOdds) : instaRips[idx].rareOdds,
    chaseOdds: chaseOdds !== undefined ? Number(chaseOdds) : instaRips[idx].chaseOdds,
  };
  return res.json(withCards(instaRips[idx], getBase(req)));
});

router.delete("/insta-rips/:id", (req, res) => {
  const idx = instaRips.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  instaRips.splice(idx, 1);
  const id = Number(req.params.id);
  const removed = instaRipCards.filter((c) => c.instaRipId === id);
  removed.forEach((c) => {
    const ci = instaRipCards.indexOf(c);
    if (ci !== -1) instaRipCards.splice(ci, 1);
  });
  return res.status(204).send();
});

router.get("/insta-rips/:id/cards", (req, res) => {
  const ripId = Number(req.params.id);
  const rip = instaRips.find((r) => r.id === ripId);
  if (!rip) return res.status(404).json({ error: "Not found" });
  return res.json(instaRipCards.filter((c) => c.instaRipId === ripId));
});

router.post("/insta-rips/:id/cards", (req, res) => {
  const ripId = Number(req.params.id);
  const rip = instaRips.find((r) => r.id === ripId);
  if (!rip) return res.status(404).json({ error: "Not found" });
  const { playerName, year, cardSet, cardNumber, rarity, marketPrice, imageUrl } =
    req.body;
  const card = {
    id: nextInstaRipCardId(),
    instaRipId: ripId,
    playerName,
    year: year ?? "",
    cardSet: cardSet ?? "",
    cardNumber: cardNumber ?? "",
    rarity: (rarity as InstaRarity) ?? "common",
    marketPrice: Number(marketPrice) || 0,
    imageUrl: imageUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  instaRipCards.push(card);
  return res.status(201).json(card);
});

router.put("/insta-rips/:id/cards/:cardId", (req, res) => {
  const cardId = Number(req.params.cardId);
  const idx = instaRipCards.findIndex(
    (c) => c.id === cardId && c.instaRipId === Number(req.params.id),
  );
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  instaRipCards[idx] = {
    ...instaRipCards[idx],
    ...req.body,
    id: cardId,
    instaRipId: Number(req.params.id),
    marketPrice: req.body.marketPrice !== undefined ? Number(req.body.marketPrice) : instaRipCards[idx].marketPrice,
  };
  return res.json(instaRipCards[idx]);
});

router.delete("/insta-rips/:id/cards/:cardId", (req, res) => {
  const cardId = Number(req.params.cardId);
  const idx = instaRipCards.findIndex(
    (c) => c.id === cardId && c.instaRipId === Number(req.params.id),
  );
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  instaRipCards.splice(idx, 1);
  return res.status(204).send();
});

router.post("/insta-rips/:id/open", (req, res) => {
  const rip = instaRips.find((r) => r.id === Number(req.params.id));
  if (!rip) return res.status(404).json({ error: "Not found" });
  const { userName } = req.body;

  const roll = Math.random() * 100;
  let hitRarity: InstaRarity;
  if (roll < rip.chaseOdds) {
    hitRarity = "chase";
  } else if (roll < rip.chaseOdds + rip.rareOdds) {
    hitRarity = "rare";
  } else {
    hitRarity = "common";
  }

  const pool = instaRipCards.filter(
    (c) => c.instaRipId === rip.id && c.rarity === hitRarity,
  );

  const base = getBase(req);

  if (pool.length === 0) {
    const anyPool = instaRipCards.filter((c) => c.instaRipId === rip.id);
    if (anyPool.length === 0) {
      return res.status(400).json({ error: "No cards configured for this insta rip" });
    }
    const fallback = anyPool[Math.floor(Math.random() * anyPool.length)];
    rip.totalOpened++;
    return res.json({
      instaRipId: rip.id,
      userName,
      hitCard: { ...fallback, imageUrl: proxyUrl(base, fallback.imageUrl) },
      hitRarity: fallback.rarity,
      openedAt: new Date().toISOString(),
    });
  }

  const hitCard = pool[Math.floor(Math.random() * pool.length)];
  rip.totalOpened++;

  return res.json({
    instaRipId: rip.id,
    userName,
    hitCard: { ...hitCard, imageUrl: proxyUrl(base, hitCard.imageUrl) },
    hitRarity,
    openedAt: new Date().toISOString(),
  });
});

export { router as instaRipsRouter };
