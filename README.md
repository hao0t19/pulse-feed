# Pulse Feed

Portfolio project: a small **UGC feed** (posts, tags, likes, comments) for a fictional commerce platform. Content lives in **MongoDB** with flexible `extras` on link posts; comments sit in a separate collection with denormalized reaction counts on each post. The API exposes filtered timelines, likes with idempotency, and **tag trending** via aggregation.

```text
Browser (Next.js)
   │
   └─ HTTP → Node.js API (Express + Mongoose)
                 │
                 └─ MongoDB (pulsefeed)
                      · posts (tags[], reactionCounts, optional extras)
                      · comments (postId + createdAt index)
                      · post_likes (unique postId + userId)
                      · $unwind + $group for /api/summary
```

One `docker compose up --build` runs MongoDB, the API, and the UI locally.

---

## Why MongoDB here (vs FlashSale’s PostgreSQL)

| Concern | This project |
|--------|----------------|
| Schema | Tags arrays, link `extras`, evolving post shapes without migrations |
| Write pattern | High-volume append (posts/comments) + atomic `$inc` on counters |
| Queries | Tag filter, author timeline, aggregation rollups for trending tags |
| Modeling | Comments referenced by `postId` (not deeply embedded) |

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS 4 |
| API | Node.js, Express 5, Zod validation, Mongoose ODM |
| Database | MongoDB 7 |
| Runtime | Docker Compose |
| Tests | Vitest (post filter builder unit tests) |

---

## Quick start

Prerequisites: Docker Desktop with Compose v2.

```powershell
cd D:\1_personal_projects\pulse-feed
copy .env.example .env
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| UI | http://localhost:3001 |
| API health | http://localhost:8081/health |
| List posts | http://localhost:8081/api/posts |
| 24h summary | http://localhost:8081/api/summary |

Walkthrough:

1. Open the UI — demo seed loads sample posts and comments on first API start (empty `posts` collection only).
2. Filter by tag `flashsale` or click a trending tag chip.
3. Publish a post, like a thread, expand comments and reply.
4. Inspect summary cards (aggregation by tag).

If the Mongo volume already has data from an older stack, seed may skip — use `docker compose down -v` once to reset.

Local development (without Docker for API):

```powershell
docker compose up mongodb -d

cd api
npm install
npm run dev

cd ..\frontend
npm install
npm run dev
```

```powershell
cd api && npm test
```

```powershell
docker compose down      # stop, keep data volume
docker compose down -v   # wipe MongoDB data
```

---

## API sketch

**POST** `/api/posts` — create post (Zod-validated body).

**GET** `/api/posts?tag=&authorId=&limit=50&cursor=` — newest-first, cursor pagination on `_id`.

**GET** `/api/posts/:id` — single post.

**POST** `/api/posts/:id/like` — body `{ "userId": "..." }`; unique index prevents duplicate likes.

**POST** `/api/posts/:postId/comments` — add comment; increments `reactionCounts.comment`.

**GET** `/api/posts/:postId/comments` — list comments for a post.

**GET** `/api/summary?hours=24` — post count + top tags (`$unwind` on `tags`) and top authors.

---

## Interview talking points

- Embed vs reference: comments in their own collection; counts denormalized on the post.
- Like idempotency via compound unique index on `(postId, userId)`.
- Index design for timelines (`authorId + createdAt`, `tags + createdAt`).
- Tag trending with `$unwind` + `$group` vs maintaining counter documents.

---

## License

MIT (personal portfolio).
