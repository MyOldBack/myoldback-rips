import { Router } from "express";
import { rips, spots } from "../store.js";

const router = Router();

router.get("/dashboard", (_req, res) => {
  const activeRips = rips.filter((r) => r.status === "active" || r.status === "spinning").length;
  const totalRips = rips.length;
  const totalSpotsSold = spots.length;
  const totalRevenue = spots.reduce((acc, s) => {
    const rip = rips.find((r) => r.id === s.ripId);
    return acc + (rip?.spotPrice ?? 0);
  }, 0);

  const recent = rips
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentRips = recent.map((rip) => {
    const ripSpots = spots.filter((s) => s.ripId === rip.id);
    return {
      ...rip,
      itemName: "Item #" + rip.itemId,
      itemImageUrl: null,
      itemEstimatedValue: 0,
      spotsSold: ripSpots.length,
    };
  });

  res.json({ activeRips, totalRips, totalSpotsSold, totalRevenue, recentRips });
});

export default router;
