# Hyperscale: The Data Center Architect

A hyper-realistic data center simulation game where you design racks, networks, storage, power, cooling, and software orchestration under real SLAs.

## Overview

This is a full-stack simulation game built with React + Express. Players operate as data center architects, managing everything from rack assembly to incident response.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context (GameContext) + TanStack Query
- **Fonts**: IBM Plex Sans (UI), JetBrains Mono (metrics), Orbitron (display headers)

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── builder/          # Rack builder components
│   │   ├── incident/         # Incident management
│   │   ├── layout/           # App layout (header)
│   │   ├── network/          # Network topology
│   │   ├── noc/              # NOC dashboard components
│   │   └── ui/               # shadcn + custom UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/
│   │   ├── game-context.tsx  # Game state management
│   │   ├── theme-provider.tsx# Dark/light mode
│   │   ├── queryClient.ts    # TanStack Query client
│   │   └── utils.ts          # Utility functions
│   ├── pages/                # Game mode pages
│   │   ├── noc-dashboard.tsx # NOC monitoring view
│   │   ├── build-mode.tsx    # Rack assembly
│   │   ├── network-mode.tsx  # Network topology
│   │   ├── floor-mode.tsx    # Floor planning
│   │   └── incident-mode.tsx # Incident management
│   └── App.tsx               # Root app component
├── shared/
│   └── schema.ts             # Zod schemas and TypeScript types
└── server/
    ├── routes.ts             # API routes
    └── storage.ts            # In-memory storage
```

## Game Modes

1. **NOC Dashboard** - Central command view with metrics, alerts, thermal heatmaps
2. **Build Mode** - Rack assembly with hardware components
3. **Floor Mode** - Data center floor planning with hot/cold aisle visualization
4. **Network Mode** - Spine-leaf topology visualization
5. **Incident Mode** - Alert triage and incident response

## Data Models

- **Hardware**: CPU, RAM, Storage, NIC, RAID Controllers
- **Infrastructure**: Racks, Servers, Network Nodes, Network Links
- **Operations**: Alerts, Incidents, Facility Metrics
- **Game State**: Money, Reputation, Tier, Contracts

## Design System

- **Theme**: Sci-fi glass-cockpit aesthetic with dark mode default
- **Colors**: NOC status colors (green, yellow, red, blue, cyan, purple)
- **Typography**: Technical precision with monospace for metrics

## Running the Project

```bash
npm run dev
```

The app runs on port 5000 with both frontend and backend served together.

## Recent Changes

- Initial implementation of all 5 game modes
- Complete UI with NOC dashboard, rack builder, network topology
- Full hardware inventory system
- Alert and incident management
- Dark/light theme support
