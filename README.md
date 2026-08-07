# SIDTM AR Campus Navigator (MVP)

Mobile-web AR navigation prototype built with React, TypeScript, Vite, and Three.js.

## Run

```bash
npm install
npm run dev
```

Open the local URL on your phone (same Wi-Fi), allow camera + location + motion permissions, choose a destination, and start navigation.

## Current MVP Scope

- Camera feed with AR overlay
- GPS tracking with weak-signal warning (`accuracy > 20m`)
- Motion/compass heading smoothing
- A* pathfinding on static campus graph (5 points of interest)
- Dynamic waypoint updates every second
- AirTag-style precision compass: rotating needle always points toward the destination, with live distance readout and proximity feedback (pulse speed + color) as you close in
- Arrival zone: reaching within `ARRIVAL_RADIUS_METERS` (25m) of the target coordinates triggers the "you are here" state, so arrival doesn't depend on a precise GPS fix
- Campus minimap (SVG): full graph of the Symbiosis Lavale hilltop campus with your live position, heading cone, highlighted route, and destination arrival ring — shown interactively in the destination picker and live in the nav HUD
- Accessibility: `aria-live` navigation announcements, `prefers-reduced-motion` support, keyboard-selectable map nodes, and text-based turn/proximity cues (not color alone)
- Destination info popup on arrival

## Update Campus Coordinates

Edit [`src/data/campus.json`](./src/data/campus.json) and replace node latitude/longitude values with your exact SIDTM locations.

