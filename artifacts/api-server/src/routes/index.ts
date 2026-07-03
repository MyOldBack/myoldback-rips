import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import itemsRouter from "./items.js";
import ripsRouter from "./rips.js";
import spotsRouter from "./spots.js";
import packsRouter from "./packs.js";
import cardPackRipsRouter from "./card-pack-rips.js";
import adminRouter from "./admin.js";
import { itemCardsRouter, ripCardsRouter } from "./cards.js";
import { instaRipsRouter } from "./insta-rips.js";
import proxyImageRouter from "./proxy-image.js";
import collectrLookupRouter from "./collectr-lookup.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(proxyImageRouter);
router.use(collectrLookupRouter);
router.use("/items", itemsRouter);
router.use("/items/:id/cards", itemCardsRouter);
router.use("/rips", ripsRouter);
router.use("/rips/:id/spots", spotsRouter);
router.use("/rips/:id/cards", ripCardsRouter);
router.use("/packs", packsRouter);
router.use("/card-pack-rips", cardPackRipsRouter);
router.use(instaRipsRouter);
router.use("/admin", adminRouter);

export default router;
