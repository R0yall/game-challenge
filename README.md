# 🎮 CyberSlope 3D — AI Vibecoding Challenge

An infinite 3D runner game built with **SvelteKit**, **Svelte 5 (Runes)**, **Threlte v8**, and **Three.js**.

Glide down a glowing neon downhill slope into infinity. Dodge monolithic pillars, jump over laser barriers, avoid moving hazards, and collect diamonds while your speed intensifies.

---

## 🏆 The AI Vibecoding Challenge Rules

This repository is built for an AI Vibecoding Challenge between 2 developers:

1. **Alternate Turns:** Developers take turns one after another.
2. **No Prior Consultation:** Do not coordinate features in advance — let the AI surprise both players!
3. **Pure Vibecoding:** Formulate a creative prompt for your AI coding assistant to implement the next feature, twist, obstacle, visual effect, or game mechanic.
4. **Log Your Turn:** Update the **Turn Log** below with your name/handle, the feature added, and your prompt/concept.
5. **Keep It Playable:** Every turn must compile cleanly (`npm run check` and `npm run build`) and remain fun to play.

---

## 📜 Turn Log

| Turn | Developer | Feature / Additions | Notes |
|:---:|:---|:---|:---|
| **0** | Base Setup | **Foundational Infinite Runner:** 3D downhill slope, rolling ball with jump physics, procedural hurdles, pillars & moving obstacles, gem pickups, Web Audio SFX, HUD, ESC pause menu, game over & restart, high score in localStorage, responsive & touch controls. | Initial release ready for Turn 1! |
| **1** | *Next Dev* | *(Your new feature here)* | *(Vibecoded with AI)* |
| **2** | *Next Dev* | *(Your new feature here)* | *(Vibecoded with AI)* |

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

# 3. Check types & diagnostics
npm run check

# 4. Production build
npm run build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser to play!

---

## 🏗️ Project Architecture

```
src/
├── app.html                       # HTML shell & viewport settings
├── routes/
│   ├── +layout.svelte             # Root layout
│   └── +page.svelte               # Game coordinator & keyboard listeners
└── lib/
    ├── types/
    │   └── game.ts                # TypeScript types (obstacles, items, states)
    ├── audio/
    │   └── sound.ts               # Web Audio API procedural sound engine
    ├── game/
    │   └── gameStore.svelte.ts    # Svelte 5 reactive game state ($state)
    └── components/
        ├── GameCanvas.svelte      # Threlte Canvas wrapper
        ├── Scene.svelte           # 3D world: slope, lighting, player, obstacles, camera
        └── UI/
            ├── HUD.svelte         # Score, distance, speed gauge, gem counter
            ├── PauseMenu.svelte   # ESC pause overlay with stats & resume
            ├── GameOverModal.svelte # Crash results, high score, instant restart
            ├── StartScreen.svelte # Main title & controls guide
            └── MobileControls.svelte # Touch buttons for mobile & tablet
```

---

## 💡 Ideas for Future Vibecoding Turns

- 🧲 **Power-ups:** Coin magnet, invincible shield, 2x multiplier, slow-motion bullet time.
- 🌈 **Visual Themes:** Vaporwave sunset mode, cyber matrix green, space galaxy warp.
- 🎵 **Dynamic Soundtrack:** Multi-track synthwave arpeggiator that ramps up with speed.
- 🌪️ **New Hazards:** Rolling boulders, disappearing floor tiles, ramps & loop-the-loops.
- 🎨 **Ball Skins / Customization:** Unlocking new spheres with collected gems.
- 📊 **Leaderboard:** Local run history or online high-score board.
