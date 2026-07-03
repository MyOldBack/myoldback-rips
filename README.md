# MyOldBack Rips

A Pokémon TCG pack-opening experience built as an Expo mobile app. Users spin a reel, reveal a random card from a curated pack inventory, and see its real market value — just like opening a physical pack, but digitally.

## Features

- **Pack Opening** — Animated spinning reel reveals a random card (common / rare / chase) based on configurable drop odds
- **Card Reveal Overlay** — Shows the actual Pokémon card image, set info, card number, and live market price
- **Multiple Packs** — Curated packs across eras: Base Set, Scarlet & Violet Elite Trainer, Bronze Mixed Pack
- **Admin Panel** — Manage packs, configure odds, and add/remove cards from the card pool via a built-in admin UI
- **Collectr Auto-fill** — Paste a Collectr URL in the admin card form to auto-populate name, set, image, and price from the pokemontcg.io API

## Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 54, React Native, Expo Router |
| API | Express 5, Node.js 24, TypeScript |
| Card Images | pokemontcg.io (proxied through API server) |
| State | TanStack Query (React Query) |
| Build | pnpm workspaces, esbuild |

## Project Structure

```
artifacts/
  api-server/     # Express 5 backend — card pool, pack opening, image proxy
  mobile/         # Expo app — pack list, spinning reveal, admin UI
  mockup-sandbox/ # Component preview server (Canvas/design use)
lib/
  api-spec/       # OpenAPI spec + generated React Query hooks & Zod schemas
```

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+

### Install

```bash
pnpm install
```

### Run

```bash
# API server (port 8080, proxied to /api)
pnpm --filter @workspace/api-server run dev

# Expo mobile app
pnpm --filter @workspace/mobile run dev
```

### Other Commands

```bash
pnpm run typecheck                        # Full typecheck across all packages
pnpm run build                            # Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen  # Regenerate API hooks from OpenAPI spec
```

## How It Works

1. The **admin** adds real Pokémon cards to a pack's card pool (via the admin UI or seed data), each tagged with rarity (`common` / `rare` / `chase`) and a market price.
2. When a user **opens a pack**, the server rolls a random number against the pack's configured odds (e.g. 70% common, 25% rare, 5% chase), picks a random card from that rarity pool, and returns it.
3. The **mobile app** animates a slot-machine reel, then flips to reveal the card with its image and market value.
4. Card images are fetched from pokemontcg.io and **proxied through the API server** to avoid CORS and ensure reliability.

## Card Data

Card images and IDs use the [pokemontcg.io](https://pokemontcg.io) database. Image URLs follow the pattern:

```
https://images.pokemontcg.io/{setId}/{cardNumber}_hires.png
```

> **Important:** The pokemontcg.io card number is NOT always the same as the printed card number on the physical card. Always verify IDs via the API (`/v2/cards/{id}`) before adding them to the pool.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes (auto) | Port for the API server (injected by Replit workflow) |
| `SESSION_SECRET` | Yes | Secret for session signing |
| `EXPO_PUBLIC_DOMAIN` | Yes | Domain for API calls from the Expo app |
| `REPLIT_DEV_DOMAIN` | Auto | Injected by Replit; used to construct proxy image URLs |

## License

MIT
