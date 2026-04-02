# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Raycast extension for managing Colima (container runtime) via a macOS menu bar item. Shows running/stopped status as a colored dot, displays VM details (profile, arch, runtime, CPU, memory, disk), and provides start/stop actions. Built with the Raycast Extensions API using React/TypeScript.

## Commands

- `npm run dev` — start Raycast development server (hot reload)
- `npm run build` — build the extension
- `npm run lint` — lint with Raycast ESLint config
- `npm run fix-lint` — auto-fix lint issues
- `npm run publish` — publish to Raycast Store

## Architecture

Single-command extension (`show-colima-status-menu-bar`) rendering a `MenuBarExtra` component. The entry point is `src/show-colima-status-menu-bar.tsx` — the filename must match the command `name` in `package.json`.

Extension metadata (commands, preferences, author, dependencies) is defined in `package.json` under the Raycast schema. The `commands` array there is the source of truth for available commands, their modes, and per-command preferences.

### Key patterns

- **Colima path resolution**: Auto-discovers colima binary via `which` then common paths (`/opt/homebrew/bin`, `/usr/local/bin`, etc.), or uses the user-configured path preference. Needed because Raycast's sandboxed environment has a limited PATH.
- **Environment**: All `execFile`/`spawn` calls must include `EXEC_ENV` which prepends system paths (`/usr/bin`, `/bin`) — colima internally calls tools like `sw_vers` that live there.
- **Status polling**: `useColimaStatus` hook polls `colima status --json` every 10 seconds and on menu open.
- **Start/stop**: Uses `spawn` with `detached: true` + `child.unref()` because Raycast unloads menu bar commands after the menu closes — a regular `execFile` callback would never fire. The 10-second polling picks up the state change afterward.

## Documentation

Use the Context7 MCP tool to retrieve up-to-date Raycast extension development documentation (API usage, components, hooks, utilities) rather than relying on training data.
