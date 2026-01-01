# Hyperscale: The Data Center Architect

An immersive 3D isometric data center simulation game where you explore a datacenter floor, click on racks to inspect their details, and manage infrastructure under real SLAs.

## Overview

This is a full-stack simulation game built with React + Express. Players operate as data center architects with a focus on visual exploration and management of datacenter infrastructure.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **3D Visualization**: CSS 3D transforms with isometric projection
- **State Management**: React Context (GameContext) + TanStack Query
- **Fonts**: IBM Plex Sans (UI), JetBrains Mono (metrics), Orbitron (display headers)

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── 3d/                   # 3D visualization components
│   │   │   ├── IsometricDataCenter.tsx  # Main isometric view
│   │   │   ├── GameHUD.tsx              # Minimal HUD overlay
│   │   │   └── RackDetailPanel.tsx      # Rack inspection panel
│   │   └── ui/                   # shadcn + custom UI components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/
│   │   ├── game-context.tsx      # Game state management
│   │   ├── theme-provider.tsx    # Dark/light mode
│   │   ├── queryClient.ts        # TanStack Query client
│   │   └── utils.ts              # Utility functions
│   ├── pages/
│   │   └── datacenter-3d.tsx     # Main 3D game view
│   └── App.tsx                   # Root app component
├── shared/
│   └── schema.ts                 # Zod schemas and TypeScript types
└── server/
    ├── routes.ts                 # API routes
    └── storage.ts                # In-memory storage
```

## Features

### 3D Isometric Datacenter View
- **Interactive Racks**: Click on any rack to inspect its details
- **Temperature Visualization**: Racks glow based on thermal status (green/yellow/orange/red)
- **Drag-to-Pan**: Click and drag to explore the datacenter floor
- **Hover Effects**: Racks lift and highlight when hovered

### HUD Overlay
- **Resource Display**: Money, reputation, and tier status
- **Facility Metrics**: Uptime, PUE, power consumption
- **Alert Indicators**: Critical and warning alert counts
- **Theme Toggle**: Dark/light mode support

### Secret Unlock System
- Enter code "Doubin" to unlock full editing capabilities
- Persisted in localStorage
- Enables admin controls for rack configuration

## Data Models

- **Hardware**: CPU, RAM, Storage, NIC, RAID Controllers
- **Infrastructure**: Racks (9 in a 3x3 grid), Servers, Network Nodes
- **Operations**: Alerts, Incidents, Facility Metrics
- **Game State**: Money, Reputation, Tier, Contracts

## Design System

- **Theme**: Sci-fi glass-cockpit aesthetic with dark mode default
- **Colors**: NOC status colors (noc-green, noc-yellow, noc-red, noc-blue, noc-cyan, noc-purple)
- **Typography**: Technical precision with monospace for metrics
- **Visual Style**: Minimal HUD, focus on the 3D datacenter environment

## Running the Project

```bash
npm run dev
```

The app runs on port 5000 with both frontend and backend served together.

## Recent Changes

- Transformed from multi-mode dashboard to immersive 3D isometric view
- Created CSS-based isometric datacenter visualization (no WebGL dependencies)
- Implemented minimal HUD overlay with facility metrics and alerts
- Added secret code unlock system ("Doubin") for admin mode
- Expanded to 9 racks in a 3x3 grid with varied thermal/power states
- Added drag-to-pan camera controls
- Built rack detail panel with thermal, power, and capacity information
