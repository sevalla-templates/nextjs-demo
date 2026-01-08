# Velo Chat — Serverless P2P Messenger

WhatsApp-inspired peer-to-peer messaging with WebRTC data channels, dual WebSocket/REST signaling, and a lightweight persisted queue for reliability. Built with Next.js (App Router), TypeScript, Tailwind CSS v4, and lowdb.

## Requirements

- Node 22 (pinned via Volta in `package.json`)
- Ports: 3000 (web), 3001 (signaling WS)
- Modern browsers with WebRTC + WebSocket support

## Install

```bash
npm install
```

## Run in Development

In separate terminals:

```bash
npm run dev          # Next.js at http://localhost:3000
npm run signal       # WS signaling at ws://localhost:3001
```

## Production / Hosting

1. Build the app

```bash
npm run build
```

1. Start both servers (parallel)

```bash
npm run start:both   # runs signaling + Next.js
```

Or run individually:

- `npm run signal`
- `npm run start` (or `npm run start:web`)

### Hosting notes

- Signaling persistence is `data/signal-db.json`; keep `data/` writable or mount as a volume.
- Behind a proxy, expose/proxy 3000 (web) and 3001 (WebSocket). Allow WS upgrades on 3001.
- For HTTPS, set `NEXT_PUBLIC_SIGNAL_WS_URL=wss://your-domain:3001`; otherwise the client auto-derives ws/wss from the page host on port 3001.
- Open TCP 3001 if you expect LAN/mobile peers to reach signaling.

## Architecture (distributed system)

- Data plane: WebRTC data channels for end-to-end messaging; no server relay once connected.
- Control plane: WebSocket signaling (preferred) with REST polling fallback for offer/answer/ICE.
- Durability: per-room/per-role queues persisted via lowdb JSON (`data/signal-db.json`) to handle reconnects/late joins.
- Status/UX: typing indicators and delivery ticks travel over the data channel for low latency.

## Features

- Welcome/profile with Dicebear avatar seeds, session-stored identity.
- WhatsApp-style UI: Sidebar (search, chats, invite modal), ChatArea with gradients, delivery ticks, typing indicator, send/newline hint.
- P2P messaging with ACK -> delivered ticks; timestamps; typing events.
- Dual signaling (WS + REST) with persisted queues for reliability.

## Project Structure (high level)

- `src/app/page.tsx` — Landing + profile setup (WelcomeScreen)
- `src/app/chat/page.tsx` — Main chat (WebRTC wiring, ChatArea, Sidebar)
- `src/app/api/signal/[roomId]/route.ts` — REST signaling fallback
- `src/server/signal-ws.mjs` — WebSocket signaling server with lowdb persistence
- `src/server/signalStore.ts` — In-memory queue for REST API
- `src/components/` — UI components (Sidebar, ChatArea, MessageList, ChatInput, WelcomeScreen)
- `src/types/index.ts` — Shared types and enums
- `data/` — Persistent signaling queues (JSON)

## Configuration

- `NEXT_PUBLIC_SIGNAL_WS_URL` — Override WS signaling endpoint (set to wss://host:3001 for HTTPS). Defaults to ws/wss derived from current host:3001.
- Ports: 3000 (web), 3001 (signaling).

## Running cross-device

1. Start signaling: `npm run signal` (ensure port 3001 reachable).
2. Start app: `npm run start` (after build) or `npm run dev`.
3. Open on two devices: same room, opposite roles (A/B), click Connect → expect “P2P Linked” and message flow.
4. If WS is blocked, REST polling auto-retries (allow a few seconds).

## Testing checklist

- `npm run build` — type check + production build.
- Two-device smoke test: role A (offer) vs role B (answer), send messages, verify typing indicator + delivered ticks.
- Block WS to observe REST fallback still connecting (with added latency).

## Maintenance

- Queues persist in `data/signal-db.json`; delete to reset.
- To change STUN servers, edit `startConnection` in `src/app/chat/page.tsx` (currently `stun:stun.l.google.com:19302`).

## Styling

Tailwind CSS v4 via `tailwind.config.ts` + `postcss.config.mjs`; globals in `src/app/globals.css`.

## Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

