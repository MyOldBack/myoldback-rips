export interface Item {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  estimatedValue: number;
  category: string;
  createdAt: string;
}

export interface Rip {
  id: number;
  itemId: number;
  spotCount: number;
  spotPrice: number;
  status: "pending" | "active" | "spinning" | "completed";
  winnerName: string | null;
  winnerSlot: number | null;
  createdAt: string;
}

export interface Spot {
  id: number;
  ripId: number;
  userName: string;
  slotNumber: number;
  purchasedAt: string;
}

export interface Pack {
  id: number;
  name: string;
  spotCount: number;
  price: number;
  discount: number;
  isActive: boolean;
  createdAt: string;
}

export type Rarity = "common" | "uncommon" | "rare" | "ultra-rare" | "legendary";

export interface CardPackRipEntry {
  id: number;
  cardPackRipId: number;
  itemId: number;
  weight: number;
  rarity: Rarity;
}

export interface CardPackRip {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  totalOpened: number;
  createdAt: string;
}

export interface CardPackRipOpenResult {
  cardPackRipId: number;
  userName: string;
  hitItemId: number;
  hitRarity: Rarity;
  openedAt: string;
}

export interface Card {
  id: number;
  playerName: string;
  year: string;
  set: string;
  cardNumber: string;
  description: string;
  rarity: Rarity;
  imageUrl: string | null;
  itemId: number | null;
  ripId: number | null;
  createdAt: string;
}

let itemIdCounter = 1;
let ripIdCounter = 1;
let spotIdCounter = 1;
let packIdCounter = 1;
let cardPackRipIdCounter = 1;
let cardPackRipEntryIdCounter = 1;
let cardIdCounter = 1;

export const items: Item[] = [
  {
    id: itemIdCounter++,
    name: "2023 Topps Chrome Hobby Box",
    description: "Sealed hobby box with chance at autographs and refractors",
    imageUrl: null,
    estimatedValue: 249.99,
    category: "Baseball",
    createdAt: new Date().toISOString(),
  },
  {
    id: itemIdCounter++,
    name: "Panini Prizm Basketball Blaster",
    description: "Blaster box with silver and color prizm parallels",
    imageUrl: null,
    estimatedValue: 59.99,
    category: "Basketball",
    createdAt: new Date().toISOString(),
  },
  {
    id: itemIdCounter++,
    name: "2024 Bowman Draft Super Box",
    description: "Super box loaded with autos and top prospect cards",
    imageUrl: null,
    estimatedValue: 399.99,
    category: "Baseball",
    createdAt: new Date().toISOString(),
  },
];

export const rips: Rip[] = [
  {
    id: ripIdCounter++,
    itemId: 1,
    spotCount: 10,
    spotPrice: 29.99,
    status: "active",
    winnerName: null,
    winnerSlot: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: ripIdCounter++,
    itemId: 2,
    spotCount: 5,
    spotPrice: 14.99,
    status: "pending",
    winnerName: null,
    winnerSlot: null,
    createdAt: new Date().toISOString(),
  },
];

export const spots: Spot[] = [
  {
    id: spotIdCounter++,
    ripId: 1,
    userName: "CardKing99",
    slotNumber: 1,
    purchasedAt: new Date().toISOString(),
  },
  {
    id: spotIdCounter++,
    ripId: 1,
    userName: "RipperMike",
    slotNumber: 2,
    purchasedAt: new Date().toISOString(),
  },
  {
    id: spotIdCounter++,
    ripId: 1,
    userName: "HoloHunter",
    slotNumber: 3,
    purchasedAt: new Date().toISOString(),
  },
];

export const packs: Pack[] = [
  {
    id: packIdCounter++,
    name: "Starter Pack",
    spotCount: 3,
    price: 24.99,
    discount: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: packIdCounter++,
    name: "Value Pack",
    spotCount: 5,
    price: 34.99,
    discount: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: packIdCounter++,
    name: "High Roller Pack",
    spotCount: 10,
    price: 59.99,
    discount: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const cardPackRips: CardPackRip[] = [
  {
    id: cardPackRipIdCounter++,
    name: "Baseball Blaster Mystery",
    description: "Crack open a mystery pack — could be a base card or a legendary auto!",
    price: 19.99,
    isActive: true,
    totalOpened: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: cardPackRipIdCounter++,
    name: "Prizm Hoops Pack",
    description: "NBA Prizm mystery pack with silver and color prizm pulls.",
    price: 29.99,
    isActive: true,
    totalOpened: 0,
    createdAt: new Date().toISOString(),
  },
];

export const cardPackRipEntries: CardPackRipEntry[] = [
  // Baseball Blaster Mystery (id=1)
  { id: cardPackRipEntryIdCounter++, cardPackRipId: 1, itemId: 1, weight: 60, rarity: "common" },
  { id: cardPackRipEntryIdCounter++, cardPackRipId: 1, itemId: 2, weight: 25, rarity: "uncommon" },
  { id: cardPackRipEntryIdCounter++, cardPackRipId: 1, itemId: 3, weight: 10, rarity: "rare" },
  // Prizm Hoops Pack (id=2)
  { id: cardPackRipEntryIdCounter++, cardPackRipId: 2, itemId: 2, weight: 55, rarity: "common" },
  { id: cardPackRipEntryIdCounter++, cardPackRipId: 2, itemId: 1, weight: 30, rarity: "uncommon" },
  { id: cardPackRipEntryIdCounter++, cardPackRipId: 2, itemId: 3, weight: 15, rarity: "rare" },
];

export const cards: Card[] = [];

export type InstaRarity = "common" | "rare" | "chase";

export interface InstaRip {
  id: number;
  name: string;
  description: string;
  cost: number;
  isActive: boolean;
  commonOdds: number;
  rareOdds: number;
  chaseOdds: number;
  totalOpened: number;
  createdAt: string;
}

export interface InstaRipCard {
  id: number;
  instaRipId: number;
  playerName: string;
  year: string;
  cardSet: string;
  cardNumber: string;
  rarity: InstaRarity;
  marketPrice: number;
  imageUrl: string | null;
  createdAt: string;
}

let instaRipIdCounter = 1;
let instaRipCardIdCounter = 1;

export const instaRips: InstaRip[] = [
  {
    id: instaRipIdCounter++,
    name: "Base Set Pack",
    description: "Chase the iconic Charizard Holo from the original 1999 Base Set!",
    cost: 9.99,
    isActive: true,
    commonOdds: 70,
    rareOdds: 25,
    chaseOdds: 5,
    totalOpened: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: instaRipIdCounter++,
    name: "Scarlet & Violet Elite Trainer",
    description: "Modern Pokémon TCG pack — better odds at ex Full Arts and special illustrations.",
    cost: 24.99,
    isActive: true,
    commonOdds: 55,
    rareOdds: 35,
    chaseOdds: 10,
    totalOpened: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: instaRipIdCounter++,
    name: "Bronze Pack",
    description: "Mixed-era mystery pack — ex cards, holos, secret rares, and promos across every generation.",
    cost: 4.99,
    isActive: true,
    commonOdds: 65,
    rareOdds: 30,
    chaseOdds: 5,
    totalOpened: 0,
    createdAt: new Date().toISOString(),
  },
];

export const instaRipCards: InstaRipCard[] = [
  // Base Set Pack
  { id: instaRipCardIdCounter++, instaRipId: 1, playerName: "Squirtle", year: "1999", cardSet: "Base Set", cardNumber: "63/102", rarity: "common", marketPrice: 3.99, imageUrl: "https://images.pokemontcg.io/base1/63_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 1, playerName: "Charmander", year: "1999", cardSet: "Base Set", cardNumber: "46/102", rarity: "common", marketPrice: 5.50, imageUrl: "https://images.pokemontcg.io/base1/46_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 1, playerName: "Arcanine Holo", year: "1999", cardSet: "Base Set", cardNumber: "23/102", rarity: "rare", marketPrice: 38.00, imageUrl: "https://images.pokemontcg.io/base1/23_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 1, playerName: "Gyarados Holo", year: "1999", cardSet: "Base Set", cardNumber: "6/102", rarity: "rare", marketPrice: 55.00, imageUrl: "https://images.pokemontcg.io/base1/6_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 1, playerName: "Charizard Holo", year: "1999", cardSet: "Base Set", cardNumber: "4/102", rarity: "chase", marketPrice: 399.99, imageUrl: "https://images.pokemontcg.io/base1/4_hires.png", createdAt: new Date().toISOString() },
  // Scarlet & Violet Elite Trainer
  { id: instaRipCardIdCounter++, instaRipId: 2, playerName: "Bruxish", year: "2023", cardSet: "Scarlet & Violet", cardNumber: "051/198", rarity: "common", marketPrice: 0.25, imageUrl: "https://images.pokemontcg.io/sv1/51_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 2, playerName: "Electrode", year: "2023", cardSet: "Paldea Evolved", cardNumber: "067/193", rarity: "common", marketPrice: 0.50, imageUrl: "https://images.pokemontcg.io/sv2/67_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 2, playerName: "Charizard ex", year: "2023", cardSet: "Obsidian Flames", cardNumber: "125/197", rarity: "rare", marketPrice: 89.99, imageUrl: "https://images.pokemontcg.io/sv3/125_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 2, playerName: "Pikachu ex", year: "2023", cardSet: "Paldea Evolved", cardNumber: "083/193", rarity: "rare", marketPrice: 69.99, imageUrl: "https://images.pokemontcg.io/sv2/83_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 2, playerName: "Miraidon ex Full Art", year: "2023", cardSet: "Scarlet & Violet", cardNumber: "244/198", rarity: "chase", marketPrice: 249.99, imageUrl: "https://images.pokemontcg.io/sv1/244_hires.png", createdAt: new Date().toISOString() },
  // Bronze Pack — commons
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Hop's Sandaconda", year: "2025", cardSet: "Destined Rivals", cardNumber: "087/182", rarity: "common", marketPrice: 0.10, imageUrl: "https://images.pokemontcg.io/sv9/87_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Scoop Up Cyclone", year: "2025", cardSet: "Prismatic Evolutions", cardNumber: "128/131", rarity: "common", marketPrice: 2.00, imageUrl: "https://images.pokemontcg.io/sv8pt5/128_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Maximum Belt", year: "2025", cardSet: "Prismatic Evolutions", cardNumber: "117/131", rarity: "common", marketPrice: 1.50, imageUrl: "https://images.pokemontcg.io/sv8pt5/117_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Giacomo", year: "2025", cardSet: "Prismatic Evolutions", cardNumber: "138/131", rarity: "common", marketPrice: 2.50, imageUrl: "https://images.pokemontcg.io/sv8pt5/138_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Komala", year: "2025", cardSet: "Destined Rivals", cardNumber: "129/182", rarity: "common", marketPrice: 0.10, imageUrl: "https://images.pokemontcg.io/sv9/129_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Regigigas", year: "2017", cardSet: "Crimson Invasion", cardNumber: "84/111", rarity: "common", marketPrice: 1.50, imageUrl: "https://images.pokemontcg.io/sm4/84_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Umbreon", year: "2023", cardSet: "Obsidian Flames", cardNumber: "130/197", rarity: "common", marketPrice: 4.00, imageUrl: "https://images.pokemontcg.io/sv3/130_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Greavard", year: "2023", cardSet: "Scarlet & Violet Promo", cardNumber: "SVPR 070", rarity: "common", marketPrice: 1.50, imageUrl: "https://images.pokemontcg.io/svp/70_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Hitmonchan Holo", year: "1999", cardSet: "Base Set", cardNumber: "7/102", rarity: "common", marketPrice: 12.00, imageUrl: "https://images.pokemontcg.io/base1/7_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Shelmet", year: "2025", cardSet: "Destined Rivals", cardNumber: "012/182", rarity: "common", marketPrice: 0.10, imageUrl: "https://images.pokemontcg.io/sv9/12_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Starmie V", year: "2022", cardSet: "Astral Radiance", cardNumber: "030/189", rarity: "common", marketPrice: 3.50, imageUrl: "https://images.pokemontcg.io/swsh10/30_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Fletchinder", year: "2023", cardSet: "Paldea Evolved", cardNumber: "199/193", rarity: "common", marketPrice: 0.50, imageUrl: "https://images.pokemontcg.io/sv2/199_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Raichu", year: "2023", cardSet: "Paldea Evolved", cardNumber: "211/193", rarity: "chase", marketPrice: 65.00, imageUrl: "https://images.pokemontcg.io/sv2/211_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Sandygast", year: "2023", cardSet: "Paldea Evolved", cardNumber: "214/193", rarity: "common", marketPrice: 0.10, imageUrl: "https://images.pokemontcg.io/sv2/214_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Yanmega ex", year: "2025", cardSet: "Destined Rivals", cardNumber: "228/182", rarity: "rare", marketPrice: 26.73, imageUrl: "https://images.pokemontcg.io/sv10/228_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Paldean Tauros", year: "2023", cardSet: "Paldea Evolved", cardNumber: "218/193", rarity: "common", marketPrice: 1.00, imageUrl: "https://images.pokemontcg.io/sv2/218_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Toedscruel", year: "2023", cardSet: "Obsidian Flames", cardNumber: "119/197", rarity: "common", marketPrice: 0.50, imageUrl: "https://images.pokemontcg.io/sv3/119_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Absol", year: "2022", cardSet: "Astral Radiance", cardNumber: "097/189", rarity: "common", marketPrice: 1.00, imageUrl: "https://images.pokemontcg.io/swsh10/97_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Clawitzer", year: "2021", cardSet: "Fusion Strike", cardNumber: "075/264", rarity: "common", marketPrice: 0.25, imageUrl: "https://images.pokemontcg.io/swsh8/75_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Leafy Camo Poncho", year: "2022", cardSet: "Silver Tempest", cardNumber: "214/195", rarity: "common", marketPrice: 3.00, imageUrl: "https://images.pokemontcg.io/swsh12/214_hires.png", createdAt: new Date().toISOString() },
  // Bronze Pack — rares
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Yamper", year: "2025", cardSet: "Phantasmal Flames", cardNumber: "099/094", rarity: "rare", marketPrice: 3.34, imageUrl: "https://images.pokemontcg.io/me2/99_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Braviary", year: "2025", cardSet: "Black Bolt", cardNumber: "155/164", rarity: "rare", marketPrice: 10.19, imageUrl: "https://images.pokemontcg.io/zsv10pt5/155_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Team Rocket's Crobat ex", year: "2025", cardSet: "Destined Rivals", cardNumber: "242/182", rarity: "rare", marketPrice: 18.28, imageUrl: "https://images.pokemontcg.io/sv10/242_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Clefairy Holo", year: "1999", cardSet: "Base Set", cardNumber: "5/102", rarity: "rare", marketPrice: 18.00, imageUrl: "https://images.pokemontcg.io/base1/5_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Probopass", year: "2024", cardSet: "Twilight Masquerade", cardNumber: "102/167", rarity: "rare", marketPrice: 6.00, imageUrl: "https://images.pokemontcg.io/sv6/102_hires.png", createdAt: new Date().toISOString() },
  // Bronze Pack — chases
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Ting-Lu ex", year: "2023", cardSet: "Paldea Evolved", cardNumber: "275/193", rarity: "chase", marketPrice: 35.00, imageUrl: "https://images.pokemontcg.io/sv2/275_hires.png", createdAt: new Date().toISOString() },
  { id: instaRipCardIdCounter++, instaRipId: 3, playerName: "Clefable Holo", year: "1999", cardSet: "Jungle", cardNumber: "1/64", rarity: "chase", marketPrice: 117.31, imageUrl: "https://images.pokemontcg.io/base2/1_hires.png", createdAt: new Date().toISOString() },
];

export function nextInstaRipId() { return instaRipIdCounter++; }
export function nextInstaRipCardId() { return instaRipCardIdCounter++; }

export function nextItemId() { return itemIdCounter++; }
export function nextRipId() { return ripIdCounter++; }
export function nextSpotId() { return spotIdCounter++; }
export function nextPackId() { return packIdCounter++; }
export function nextCardPackRipId() { return cardPackRipIdCounter++; }
export function nextCardPackRipEntryId() { return cardPackRipEntryIdCounter++; }
export function nextCardId() { return cardIdCounter++; }
