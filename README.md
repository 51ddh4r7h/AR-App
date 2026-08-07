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
- A* pathfinding on static campus graph
- Dynamic waypoint updates every second
- AirTag-style precision compass: rotating needle always points toward the destination, with live distance readout and proximity feedback (pulse speed + color) as you close in
- Destination info popup on arrival

## Update Campus Coordinates

Edit [`src/data/campus.json`](./src/data/campus.json) and replace placeholder node latitude/longitude values with your exact SIDTM locations.

