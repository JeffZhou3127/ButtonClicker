# Space Mission Design Game — Plan

NASA Space Apps 2026 challenge: *Space Mission Design Game* (Intermediate, Beginner/Youth, subject: Games).

## What the challenge asks for (the judging rubric in disguise)
- Design a **whole mission**, concept to operation: objective → spacecraft → instruments → launch vehicle → orbit → simulate → evaluate.
- Visible **trade-offs** across six resources: **mass, power, budget, data, communications, time/lifetime**. Every decision must have a consequence.
- **Teams of up to 4** with roles (mission planning, spacecraft design, science, comms/resources) who negotiate.
- **Education**: explain *why* a mission succeeded or failed, not just pass/fail. Beginner-friendly.
- Nice-to-haves: scenarios, difficulty levels, random events, leaderboards, mission reports, save/share/compare designs, sandbox, post-mission analysis.

Takeaway: the KSP-style economy / contracts / research tree is a great fit, but the judges grade on **mission design trade-offs + 4-player collaboration + teaching**. Rocket flying is optional; don't let it eat the schedule.

## Core concept
"KSP's space program meets mission-design tool." The player runs a **space agency**. Each **contract** is a mission brief (e.g. "Map Mars's surface for 2 years"). The team designs a mission, launches, simulates it, gets paid by performance, and spends the money/science on the **research tree**, which unlocks better parts.

### Game loop
1. **Contracts board** — pick a mission (objective, requirements, deadline, reward, difficulty).
2. **Design** (the heart of the game) — builder UI with live resource meters.
3. **Launch + flight** — pick launch vehicle and orbit; the sim checks compatibility.
4. **Operations** — time-accelerated mission sim: power, data downlink, events (solar flare, anomaly).
5. **Report** — score + "why it worked / failed" breakdown, which also teaches.
6. **Economy** — funds + science points + reputation → research tree → better parts → harder contracts.

## Systems

### Economy
- **Funds** (build/launch cost, contract payouts), **Science** (from instrument data returned; spent on research tree), **Reputation** (unlocks higher-tier contracts; hurt by failures).
- Costs: parts, launch vehicle, ground-station time. Optional reuse/refund to reward efficiency.

### Contracts / missions
- Data-driven JSON: objective type (Earth observation, comms relay, lunar orbiter, Mars orbiter, flyby, space telescope, sample return), required orbit, required instruments, min lifetime, budget cap, bonus goals (under-budget, early, extra data).
- Tutorial chain → career. Plus **sandbox** (no limits) and **random events**.

### Research tree
- Nodes: launchers, bus parts (solar panels, batteries, antennas, computers, ADCS, thrusters), instruments, orbit/mission capabilities (Moon, Mars, outer planets).
- Cost in Science (+ Funds). Dependencies as a DAG, JSON-defined, rendered as a graph.

### Mission design model (the educational core)
Keep it **simplified but physically honest**, all computed from part stats:
- **Mass budget**: sum of parts ≤ launch vehicle capacity *to that orbit* (lookup table of kg-to-LEO/GTO/TLI/etc.).
- **Delta-v**: Tsiolkovsky equation for orbit insertion and maneuvers (a delta-v map à la KSP).
- **Power**: solar panel output × distance from Sun² × eclipse fraction vs. load; battery covers eclipse.
- **Data / comms**: instrument data rate × duty cycle → onboard storage → downlink (antenna gain, distance, ground-station contact windows from the orbit). Shows the "data bottleneck".
- **Lifetime**: orbit decay (altitude), radiation, fuel for station-keeping, reliability.
- **Budget**: parts + launch + operations.
- Orbit options (LEO, SSO, GEO, lunar, etc.) each with plain-language tradeoffs (coverage, revisit, comm windows).
- **Flight plan (maneuver planner)**: the mission is a timeline of pre-programmed maneuvers (ascent, parking orbit, Hohmann/bi-elliptic transfer, plane change, orbit insertion, station-keeping, deorbit). Players choose and tune nodes; the engine computes each burn from real orbital mechanics (vis-viva, Hohmann/Lambert-lite, patched conics, Tsiolkovsky) and checks the total delta-v against the vehicle's budget plus a margin. Everything propagates "on rails" with Kepler orbits and time warp, so it is deterministic and server-verifiable.
- **Hands-on layer (optional, 1st-person)**: see "Execution mode" below. Real-time piloting is replaced by short skill moments that improve execution quality.

### Execution mode (keeping first-person playability)
The plan is the star; flying is how you *execute* it. At each key event the player can **Autopilot** (nominal result with small random dispersion) or **Fly it** for better accuracy and bonus score:
- **Spacecraft view (2D)**: a side-on cutaway of the spacecraft/cockpit drawn in 2D, with a HUD: orbit, apoapsis/periapsis, delta-v left, burn countdown, maneuver marker. The player (as astronaut) is at stations in the cutaway and clicks/drags panels, or walks left/right between modules like a 2D platformer.
- **Mission Control / Astronaut switching**: every player has a role and can be in Mission Control (dashboard, planner, telemetry) or aboard the spacecraft (2D cutaway tasks). Both are views of the same state. Communication delay and blackouts (behind a planet, no ground-station contact) link them: Control sees only downlinked telemetry, and commands arrive late. Crewed missions add life-support mass/power/cost.
- **Burn execution**: align to the maneuver vector and hold throttle until the planned delta-v is reached. Over/undershoot becomes real orbit error that the sim propagates, costing correction fuel.
- **Ascent**: a simple gravity-turn steering mini-game (pitch program vs. dynamic pressure/fuel).
- **Comms/ops moments**: point the antenna, schedule downlink windows, respond to anomalies (event cards).
- **Landing/rendezvous** only for later scenarios; these stay short and forgiving.
- Skipped moments never block progress; flying gives a precision multiplier, not a pass/fail gate. In team mode each role gets the moment that fits it (Engineer flies the burn, Comms handles the antenna).
- The whole game is 2D: top-down orbit map, 2D cutaway spacecraft, 2D HUD. Physics stays simple (2D patched conics on rails), so the views are visualizations of the same deterministic state, not a separate engine.

### Multiplayer (hosted from your PC, up to 4 players per mission)
- Lobby: create/join a room with code. Shared mission, shared budget.
- Roles, each owning part of the design and seeing a role-specific panel:
  - **Mission Lead** (contract, budget, final approve/launch)
  - **Spacecraft Engineer** (bus: power, structure, ADCS)
  - **Science Lead** (instruments, data value)
  - **Comms & Ops** (antennas, orbit, downlink plan, events response)
- Shared live design state, chat, and a **conflict mechanic** (e.g. Science wants +40 kg of instruments, Engineer has 12 kg left → propose/vote/negotiate). Score includes a "coordination" component.
- Solo mode plays all roles.

## Architecture

```
/                  (monorepo, npm workspaces)
  client/          React + Vite (existing app moves here)
  server/          Node.js + Fastify + ws (or Socket.IO)
  shared/          Pure TS/JS: sim engine, part/contract/tech data, types, scoring
```

- **Shared sim engine** is pure functions (`evaluateDesign(design, contract) → resources, warnings`; `simulateMission(...) → timeline, events, score`). The client runs it for instant feedback; the **server runs it authoritatively** (prevents cheating on leaderboards, keeps all 4 players consistent).
- **Server state**: rooms in memory; **persistence in SQLite** (`better-sqlite3`) for accounts/nicknames, agency save (funds, tech, completed contracts), saved designs, leaderboard. Zero-install DB that suits a home PC.
- **Realtime**: WebSocket messages like `design:update` (ops, not full state), `chat`, `vote`, `launch`. Start with last-write-wins on a per-part basis with role-based ownership; that avoids CRDT complexity.
- **Frontend**: React + Zustand for state; **SVG/Canvas** for orbit view and spacecraft diagram; **2D only** (Canvas via PixiJS or plain Canvas for the orbit map and cutaway, SVG/React for dashboards; no 3D library). Add TypeScript for the shared package (rename files to `.ts`/`.tsx`); it pays off for the data schemas.
- **Hosting on your PC**: the Node server also serves the built client (one port, e.g. 3000). Options to reach friends/judges: (1) **Cloudflare Tunnel** (free, HTTPS, no port-forwarding, the recommended one); (2) Tailscale for a private group; (3) router port-forward + dynamic DNS. Allow it through Windows Firewall for LAN play. For the submission, also deploy a **single-player-capable static build** (e.g. GitHub Pages/Netlify) so the judges can play even if your PC is off. The sim in `shared/` makes that nearly free.

## Phased roadmap (each phase is a playable demo)
| # | Phase | Deliverable |
|---|---|---|
| 0 | Restructure | Monorepo, TS, lint, move the Vite app, hello-world WebSocket server |
| 1 | Design core (solo) | Parts data, builder UI, live mass/power/budget/data/comms meters, launch-vehicle check, 1 contract |
| 2 | Simulation + report | Orbit choice, maneuver planner (Hohmann etc.), on-rails time-accelerated sim, score, post-mission "why" report, random events |
| 2b | Execution mode | 2D spacecraft cutaway + one burn mini-game with autopilot fallback; Control/Astronaut switch |
| 3 | Campaign | Contracts board, funds/science/rep, research tree, save to localStorage |
| 4 | Multiplayer | Server rooms, 4 roles, shared design, chat, negotiate/vote, launch together |
| 5 | Persistence + polish | SQLite saves, leaderboard, share/compare designs, tutorial, difficulty levels, sandbox |
| 6 | Visuals/audio | Orbit view, spacecraft diagram, animations, glossary tooltips |

**Hackathon cut line:** the minimum winning demo is phases 1, 2, 4 (a 4-player cooperative mission with a great report) plus a thin slice of 3 (contracts + a small tree). Phases 5 and 6 are bonus.

## Educational layer (don't skip, it is part of the judging)
- Glossary tooltips on every term (delta-v, eclipse, downlink, SSO…).
- Report cards: "Your power dropped below load for 18% of each orbit because of eclipse; add 1 battery or a 2nd panel."
- Difficulty levels: Easy (few parts, forgiving), Normal, Expert (real constraints).
- Use real data for realism and credit: launcher capacities, real mission examples (Landsat, MRO, JWST) as scenario templates, NASA imagery. Check the challenge's **Resources tab** for approved datasets.

## Risks
- **Scope creep from KSP**: skip physics-based flight and 3D part assembly. Use "on-rails" orbits and a slot-based builder.
- **Balancing the economy**: put all numbers in JSON and tune with a spreadsheet; write a tiny script that auto-plays contracts to spot broken ones.
- **Sync bugs in the multiplayer design editor**: server-authoritative, small op messages, per-role ownership.
- **Home-PC uptime**: ship the static single-player build as a fallback.

## Open decisions for you
1. Team size and hackathon duration (determines the cut line).
2. TypeScript or stay JS?
3. 2D visual style: clean engineering-dashboard vs. retro/pixel art.
4. Should the game remain a Windows-local hosted server only, or also deploy a public version?
