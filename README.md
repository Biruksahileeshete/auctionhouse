# AuctionHouse

**Real-time bidding platform** built to demonstrate correctness under concurrency — not just "a website with WebSockets," but a system that guarantees exactly one winning bid even when multiple people bid on the same item within milliseconds of each other.

## The core problem this project solves

Two bidders click "bid" on the same auction at nearly the same instant. The backend must guarantee:
- Exactly one bid is accepted as the new highest bid — never both, never neither
- The final price is always correct, even under concurrent load
- Everyone watching sees the true, committed state in real time — never an optimistic state that later turns out to be wrong

This is handled with row-level database locking (`SELECT ... FOR UPDATE`) inside a transaction, and by broadcasting to WebSocket clients only *after* that transaction commits — never before.

## Core features (MVP)

- Auth (JWT, bcrypt)
- Create and browse auction listings
- **Real-time bidding** — live updates for everyone watching an auction
- **Anti-sniping** — a bid in the final ~30 seconds automatically extends the deadline, server-side only (never trusts client-reported time)
- Outbid notifications, delivered in real time
- Full bid history / audit trail per listing
- Search and filtered browsing for active auctions
- My auctions dashboard and quick listing stats
- Sign out flow with secure local token cleanup
- Image fallbacks and polished product cards for visual clarity
- Stripe payment on auction close (MVP: simple charge to the platform; real per-seller payouts via Stripe Connect are a deliberate v2 addition, not MVP scope)

## Nice-to-have features added in this iteration

- Better landing-page hero and market-style dashboard UI
- Search by title with “ending soon” and “my auctions” views
- Light, airy, premium design system to make the storefront feel more modern and creative
- Image placeholder handling so listings without images still look intentional instead of broken
- Cleaner sign-in / sign-out flows for a more complete user experience

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, Socket.io, Prisma ORM |
| Database | PostgreSQL |
| Payments | Stripe |
| Deployment | Vercel (frontend), Render (backend — needs a persistent server for WebSockets, not serverless) |

## What this project demonstrates

Correctness under concurrency (the hardest, most valuable part), server-authoritative real-time systems, transactional database design, and a payments integration — deliberately distinct from a typical CRUD-and-AI portfolio project.

## Status

🚧 In development.
