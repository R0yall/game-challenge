# 🎮 CyberSlope 3D — AI Vibecoding Challenge

An infinite 3D runner game built with **Pure Three.js** and **Vite (TypeScript)**.

Race down a glowing neon downhill slope as a pixel cat, leaving a rainbow trail behind you. Dodge monolithic pillars, jump over laser barriers, avoid moving hazards, and collect diamonds while your speed intensifies.

---

## 🏆 The AI Vibecoding Challenge Rules

This repository is built for an AI Vibecoding Challenge between 2 developers:

1. **Alternate Turns:** Developers take turns one after another.
2. **No Prior Consultation:** Do not coordinate features in advance — let the AI surprise both players!
3. **Pure Vibecoding:** Formulate a creative prompt for your AI coding assistant to implement the next feature, twist, obstacle, visual effect, or game mechanic.
4. **Log Your Turn:** Update the **Turn Log** below with your name/handle, the feature added, and your prompt/concept.
5. **Keep It Playable:** Every turn must compile cleanly (`npm run build`) and remain smooth and fun to play.

---

## 📜 Turn Log

| Turn | Developer | Feature / Additions | Notes |
|:---:|:---|:---|:---|
| **0** | Base Setup | **Clean Pure Three.js + Vite Engine:** Mathematically seamless downhill slope, rolling cyber ball with jump & roll physics, procedural hurdles, pillars & moving obstacles, gem pickups, Web Audio SFX, HUD, ESC pause menu, game over & restart, high score in localStorage, responsive & touch controls. | Initial release ready for Turn 1! |
| **1** | Nytro | **Top 20 Leaderboard & Rainbow Cat Invincibility:** Named high scores saved to shared JSON, Top 20 leaderboard modal, rainbow cat player model with rainbow trail, invincibility power-up gems with speed streaks and custom synth chime. | Turn 1 additions |
| **2** | Royall | **3D UFO Hazard Encounter & Dreamlo Cloud Highscores:** Adds a dynamic 3D UFO encounter that pursues the player down the slope and drops dodgeable cyber-bombs with road impact shockwaves. Migrated leaderboard to Dreamlo for automatic real-time cloud score syncing across players, and added local player name persistence. | Turn 2 additions |
| **3** | *Next Dev* | *(Your new feature here)* | *(Vibecoded with AI)* |

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
|:---|:---|:---|
| **Steer Left / Right** | `A` / `D` or `←` / `→` | Left / Right touch buttons |
| **Jump** | `Space`, `W`, or `↑` | Jump button |
| **Pause Menu** | `Escape` | Pause icon (top right) |
| **Restart Game** | `R` (when paused/game over) or `Space` | Play Again button |
| **Mute / Unmute** | Click Sound icon | Sound icon (top right) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Production build
npm run build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser to play!

### Sharing the high score

Enter your name before starting. Every completed run while playing at `localhost` with `npm run dev` is considered for the top 20 in `src/data/highscore.json`. Open the leaderboard from the start or game-over screen. Commit and push that file with your changes to share the record; other developers receive it when they pull. It does not push automatically.

Scores also stay in the current browser's local storage. The production build and games opened through a network address cannot write the project file, so their scores remain local to that browser. To share a score, play from localhost in the development server. Existing unnamed browser records appear as “Unknown”.


---

## 🏗️ Project Architecture

Built with pure, modular Three.js — making it exceptionally clean and easy for any AI to expand:

```
├── index.html              # HTML canvas & glassmorphism UI overlays
├── style.css               # Cyber neon UI styling
├── package.json            # Vite + Three.js + TypeScript
├── tsconfig.json           # TypeScript configuration
└── src/
    ├── main.ts             # Entry point: binds inputs, UI events, starts game
    └── game/
        ├── SlopeMath.ts    # Downhill slope math & coordinate projection
        ├── Player.ts       # Pixel cat, rainbow trail, steering & jump physics, shadow
        ├── Track.ts        # Seamless downhill road segments & neon rails
        ├── Obstacles.ts    # Jumpable hurdles, tall pillars, moving lasers, gems
        ├── Starfield.ts    # Single-drawcall cosmic star particles
        ├── Audio.ts        # Procedural retro SFX synthesizer (Web Audio API)
        ├── UfoEncounter.ts # 3D Low-poly saucer, mystery alien pilot, dynamic pursuit & bomb hazards
        └── Game.ts         # Master game loop, camera tracking, collisions
```

---

## 💡 Ideas for Future Vibecoding Turns

- 🧲 **Power-ups:** Coin magnet, invincible shield, 2x multiplier, slow-motion bullet time.
- 🌈 **Visual Themes:** Vaporwave sunset mode, cyber matrix green, space galaxy warp.
- 🎵 **Dynamic Soundtrack:** Multi-track synthwave arpeggiator that ramps up with speed.
- 🌪️ **New Hazards:** Rolling boulders, disappearing floor tiles, ramps & loop-the-loops.
- 🎨 **Ball Skins / Customization:** Unlocking new spheres with collected gems.
- 📊 **Leaderboard:** Local run history or online high-score board.
