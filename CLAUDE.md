# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Raycast extension for checking Colima (container runtime) status, displayed as a macOS menu bar item. Built with the Raycast Extensions API using React/TypeScript.

## Commands

- `npm run dev` — start Raycast development server (hot reload)
- `npm run build` — build the extension
- `npm run lint` — lint with Raycast ESLint config
- `npm run fix-lint` — auto-fix lint issues
- `npm run publish` — publish to Raycast Store

## Architecture

Single-command extension (`show-colima-status-menu-bar`) rendering a `MenuBarExtra` component. The entry point is `src/show-colima-status-menu-bar.tsx` — the filename must match the command `name` in `package.json`.

Extension metadata (commands, author, dependencies) is defined in `package.json` under the Raycast schema. The `commands` array there is the source of truth for available commands and their modes.

## Documentation

Use the Context7 MCP tool to retrieve up-to-date Raycast extension development documentation (API usage, components, hooks, utilities) rather than relying on training data.
