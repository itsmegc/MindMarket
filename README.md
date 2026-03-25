# MindMarket — Community Prediction Market for Reddit

MindMarket brings prediction markets natively to Reddit. Moderators post questions ("Will GPT-5 launch before June 2026?"), community members vote YES or NO, live odds update in real time, and winners earn points on a per-subreddit leaderboard — all without leaving Reddit.

---

## Features

- **Create predictions** — Mods create time-limited prediction posts from the subreddit menu
- **Vote live** — Users tap to vote; percentages and bars update in real time
- **One vote per user** — Votes are locked once cast; your pick is highlighted
- **Mod resolves** — Mods declare a winner; correct predictors earn +10 points each
- **Leaderboard** — Per-subreddit rankings sorted by points and accuracy
- **Auto-expiry** — A daily scheduler job marks stale predictions as expired

---

## How to Install (Moderators)

1. Visit the [Reddit App Directory](https://developers.reddit.com) and search for **MindMarket**
2. Click **Add to Community** and select your subreddit
3. Grant the requested permissions (Reddit API, KV Store, Scheduler, Realtime)
4. MindMarket menu items will appear in your subreddit's mod tools

---

## How to Use — Moderators

### Creating a Prediction
1. Go to your subreddit
2. Open the **Mod Tools** menu → **Create Prediction**
3. Fill in:
   - **Prediction question** (e.g. "Will r/gaming hit 50M members by 2027?")
   - **Option A** (default: Yes)
   - **Option B** (default: No)
   - **Expires in (days)** (default: 7)
4. Submit — a custom prediction post appears in your feed instantly

### Resolving a Prediction
1. Navigate to the prediction post
2. Open the post's **Mod Tools** menu → **Resolve Prediction**
3. Select the winning option (A or B)
4. Submit — the post updates to show the winner, and points are awarded automatically

---

## How to Use — Community Members

### Voting
1. Open any active MindMarket prediction post in your feed
2. Tap **Vote A** or **Vote B** — your vote is locked immediately
3. Watch the live percentage bars update as others vote

### Leaderboard
1. Go to the subreddit menu → **View Leaderboard**
2. A leaderboard post shows the top 10 predictors with their points and accuracy

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Platform | [Reddit Devvit](https://developers.reddit.com) |
| Language | TypeScript |
| UI | Devvit Blocks (native Reddit UI) |
| Storage | Devvit KV Store (Redis-compatible) |
| Live updates | Devvit Realtime (`useChannel`) |
| Scheduling | Devvit Scheduler (daily expiry check) |

---

## Changelog

### v1.0.0
- Initial release
- Mod menu: Create Prediction, Resolve Prediction, View Leaderboard
- Live vote bars with real-time updates via Devvit Realtime
- Per-subreddit leaderboard with points and accuracy tracking
- Daily scheduler job for automatic prediction expiry
