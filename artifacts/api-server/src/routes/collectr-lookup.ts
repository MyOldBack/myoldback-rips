import { Router } from "express";

const router = Router();

const COLLECTR_SLUG_TO_SET_ID: Record<string, string> = {
  "base-set": "base1",
  "jungle": "base2",
  "fossil": "base3",
  "base-set-2": "base4",
  "team-rocket": "base5",
  "gym-heroes": "gym1",
  "gym-challenge": "gym2",
  "neo-genesis": "neo1",
  "neo-discovery": "neo2",
  "southern-islands": "si1",
  "neo-revelation": "neo3",
  "neo-destiny": "neo4",
  "legendary-collection": "base6",
  "expedition-base-set": "ecard1",
  "aquapolis": "ecard2",
  "skyridge": "ecard3",
  "ruby-sapphire": "ex1",
  "sandstorm": "ex2",
  "dragon": "ex3",
  "team-magma-vs-team-aqua": "ex4",
  "hidden-legends": "ex5",
  "firered-leafgreen": "ex6",
  "team-rocket-returns": "ex7",
  "deoxys": "ex8",
  "emerald": "ex9",
  "unseen-forces": "ex10",
  "delta-species": "ex11",
  "legend-maker": "ex12",
  "holon-phantoms": "ex13",
  "crystal-guardians": "ex14",
  "dragon-frontiers": "ex15",
  "power-keepers": "ex16",
  "diamond-pearl": "dp1",
  "mysterious-treasures": "dp2",
  "secret-wonders": "dp3",
  "great-encounters": "dp4",
  "majestic-dawn": "dp5",
  "legends-awakened": "dp6",
  "stormfront": "dp7",
  "platinum": "pl1",
  "rising-rivals": "pl2",
  "supreme-victors": "pl3",
  "arceus": "pl4",
  "heartgold-soulsilver": "hgss1",
  "unleashed": "hgss2",
  "undaunted": "hgss3",
  "triumphant": "hgss4",
  "call-of-legends": "col1",
  "black-white": "bw1",
  "emerging-powers": "bw2",
  "noble-victories": "bw3",
  "next-destinies": "bw4",
  "dark-explorers": "bw5",
  "dragons-exalted": "bw6",
  "boundaries-crossed": "bw7",
  "plasma-storm": "bw8",
  "plasma-freeze": "bw9",
  "plasma-blast": "bw10",
  "legendary-treasures": "bw11",
  "xy": "xy1",
  "flashfire": "xy2",
  "furious-fists": "xy3",
  "phantom-forces": "xy4",
  "primal-clash": "xy5",
  "roaring-skies": "xy6",
  "ancient-origins": "xy7",
  "breakthrough": "xy8",
  "breakpoint": "xy9",
  "fates-collide": "xy10",
  "steam-siege": "xy11",
  "evolutions": "xy12",
  "sun-moon": "sm1",
  "guardians-rising": "sm2",
  "burning-shadows": "sm3",
  "shining-legends": "sm35",
  "crimson-invasion": "sm4",
  "ultra-prism": "sm5",
  "forbidden-light": "sm6",
  "celestial-storm": "sm7",
  "dragon-majesty": "sm75",
  "lost-thunder": "sm8",
  "team-up": "sm9",
  "detective-pikachu": "det1",
  "unbroken-bonds": "sm10",
  "unified-minds": "sm11",
  "hidden-fates": "sm115",
  "cosmic-eclipse": "sm12",
  "sword-shield": "swsh1",
  "rebel-clash": "swsh2",
  "darkness-ablaze": "swsh3",
  "champions-path": "swsh35",
  "vivid-voltage": "swsh4",
  "shining-fates": "swsh45",
  "battle-styles": "swsh5",
  "chilling-reign": "swsh6",
  "evolving-skies": "swsh7",
  "celebrations": "cel25",
  "fusion-strike": "swsh8",
  "brilliant-stars": "swsh9",
  "astral-radiance": "swsh10",
  "pokemon-go": "pgo",
  "lost-origin": "swsh11",
  "silver-tempest": "swsh12",
  "crown-zenith": "swsh12pt5",
  "scarlet-violet": "sv1",
  "paldea-evolved": "sv2",
  "obsidian-flames": "sv3",
  "paradox-rift": "sv4",
  "paldean-fates": "sv4pt5",
  "temporal-forces": "sv5",
  "twilight-masquerade": "sv6",
  "stellar-crown": "sv7",
  "surging-sparks": "sv8",
  "prismatic-evolutions": "sv8pt5",
  "journey-together": "sv9",
};

function bestPrice(tcgplayer: Record<string, Record<string, Record<string, number>>> | undefined): number | null {
  if (!tcgplayer?.prices) return null;
  const order = ["holofoil", "normal", "reverseHolofoil", "1stEditionHolofoil", "1stEditionNormal"];
  for (const pt of order) {
    const p = tcgplayer.prices[pt]?.market;
    if (p) return p;
  }
  for (const p of Object.values(tcgplayer.prices)) {
    if (p?.market) return p.market;
  }
  return null;
}

router.post("/collectr-lookup", async (req, res) => {
  const { url } = req.body ?? {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const cardsIdx = parts.indexOf("cards");
  if (cardsIdx === -1 || parts.length < cardsIdx + 4) {
    return res.status(400).json({
      error: "Paste a full Collectr card URL like: app.getcollectr.com/cards/pokemon/{set}/{number}",
    });
  }

  const setSlug = parts[cardsIdx + 2];
  const cardNumber = parts[cardsIdx + 3];

  const setId = COLLECTR_SLUG_TO_SET_ID[setSlug];
  if (!setId) {
    return res.status(400).json({
      error: `Unknown set "${setSlug}". Try adding the card manually.`,
    });
  }

  const cardId = `${setId}-${cardNumber}`;

  try {
    const apiRes = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
      headers: { "Accept": "application/json" },
    });

    if (!apiRes.ok) {
      return res.status(404).json({ error: `Card not found (${setId} #${cardNumber})` });
    }

    const json = (await apiRes.json()) as { data: Record<string, unknown> };
    const c = json.data;
    const set = c.set as Record<string, string> | undefined;
    const images = c.images as Record<string, string> | undefined;
    const tcgplayer = c.tcgplayer as Record<string, Record<string, Record<string, number>>> | undefined;

    return res.json({
      name: c.name,
      cardSet: set?.name ?? "",
      cardNumber: String(c.number),
      year: set?.releaseDate?.split("/")?.[0] ?? "",
      imageUrl: images?.large ?? images?.small ?? null,
      marketPrice: bestPrice(tcgplayer),
      pokemontcgId: c.id,
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach pokemontcg.io — try again" });
  }
});

export default router;
