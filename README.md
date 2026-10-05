# 🛡️ SECURITY JEOPARDY — Official Platform

> **A high-intensity, time-bound college cybersecurity competition platform blending algorithmic digital riddles with a live campus physical flag hunt.**

Organized by: **CyberGuardian Club**  
Faculty Coordinator: **Prof. Firdous Sadaf**  
Club Coordinator: **Shruti Bawankar**  

---

## 📋 Table of Contents
1. [Event Overview & Architecture](#-event-overview--architecture)
2. [Game Flow Protocol](#-game-flow-protocol)
3. [Challenge Directory](#-challenge-directory)
   - [Online Challenges (10 Riddles)](#10-online-cybersecurity-challenges-10-pts-each)
   - [Physical Challenges (5 Campus Waypoints)](#5-physical-flag-hunts-20-pts-each)
   - [Final Meta Mission](#final-meta-cipher-mission)
4. [Competition Integrity & Security Rules](#-competition-integrity--security-rules)
5. [Quick Start & Setup](#-quick-start--setup)
6. [Credentials & Demo Accounts](#-credentials--demo-accounts)
7. [API & Architecture Summary](#-api--architecture-summary)

---

## 🎯 Event Overview & Architecture

- **Total Challenges:** 15 Challenges (10 Online + 5 Physical) + 1 Final Meta Mission
- **Total Duration:** 60 minutes (Server-authoritative timer with pause/resume controls)
- **Scoring System:**
  - Online Challenges: **10 base points** each (Max 100 pts)
  - Physical Challenges: **20 base points** each (Max 100 pts)
  - Hint 1 Deduction: **-2 points**
  - Hint 2 Deduction: **-3 points**
  - Max Attempts: **3 attempts per riddle** (Three-strike lockout policy)
- **Anti-Congestion Route Rotation:** Physical challenges use an automated rotating route algorithm based on the team's route index so different teams start at different campus hotspots.
- **Physical Flag Isolation:** Physical flag stickers are **team-specific**. Entering another team's flag is automatically blocked and flagged as a security violation.

---

## 🔄 Game Flow Protocol

```
[ 01: SOLVE ]   Crack online cybersecurity riddle in terminal
       ↓
[ 02: DECODE ]  Accurate solve decrypts campus waypoint location clue
       ↓
[ 03: LOCATE ]  Navigate to the designated campus hotspot
       ↓
[ 04: HUNT ]    Discover your squad's isolated physical flag code
       ↓
[ 05: RETURN ]  Safely return to station without alerting rival teams
       ↓
[ 06: SUBMIT ]  Submit flag code to capture fragment (C, Y, B, E, R)
       ↓
[ 07: META ]    Assemble all 5 fragments into the master keyword: "CYBER"
```

### Final Meta Cipher Mission

Once a squad captures all 5 physical flags, the fragments:
$$\mathbf{C} + \mathbf{Y} + \mathbf{B} + \mathbf{E} + \mathbf{R}$$
unlock the Final Meta Terminal. The team enters the master keyword:
$$\mathbf{CYBER}$$
to achieve full mission completion.

---

## 🔒 Competition Integrity & Security Rules

1. **Anti-Poaching Isolation:** Physical flags have team-specific signatures (`P[Step]-SJ-T[Num]-[Frag]-[Digits]`). Attempting to submit another team's flag is blocked and logged.
2. **Three-Strike Lockout:** Teams get 3 attempts per riddle. On the 3rd failed attempt, that challenge permanently locks as `FAILED (0 pts)`; the next online riddle / physical route step still unlocks. (A failed physical step means that fragment can't be captured, so the Final Meta Mission is no longer reachable for that team.)
3. **Rate Limiting:** Express API rate limiters prevent brute force automated submission scripts.
4. **Server Authoritative Timer:** Countdown is computed strictly on the backend. No submissions are accepted when the event is `PAUSED`, `ENDED`, or `NOT_STARTED`.
5. **Classified Leaderboard:** Administrators can toggle the scoreboard to "Classified" during the final minutes to build suspense before the awards ceremony.

---

*(Teams can also register dynamically from the "Register Team" page, which automatically creates their unique team code and isolated campus flag sequence).*

---

## 🏗️ Project Structure

```
d:/Security Jeopardy
├── client/                     # Frontend (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Navbar, CountdownTimer, Footer
│   │   ├── context/            # AuthContext (JWT & state management)
│   │   ├── pages/              # Home, Rules, Register, Login, AdminLogin,
│   │   │                       # OnlineChallenges, PhysicalHunt, Leaderboard,
│   │   │                       # AdminDashboard
│   │   ├── api.ts              # Type-safe API client
│   │   ├── types.ts            # Shared TypeScript interfaces
│   │   ├── index.css           # Tailwind cyberpunk themes & glowing effects
│   │   └── App.tsx             # Main router and view orchestrator
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + TypeScript + Prisma)
│   ├── src/
│   │   ├── routes/             # auth, challenges, physical, leaderboard, admin, event
│   │   ├── middleware/         # JWT authentication, role guards
│   │   ├── utils/              # Answer normalizer, route rotator, event timer helper
│   │   ├── tests/              # Comprehensive test suites (game.test.ts)
│   │   └── index.ts            # Server entry point with rate limiters
│   └── package.json
│
├── prisma/
│   ├── schema.prisma           # Complete PostgreSQL relational schema
│   └── seed.ts                 # Seeds 15 challenges + admin (demo teams only with SEED_DEMO_TEAMS=true)
│
└── package.json                # Monorepo root orchestration scripts
```
