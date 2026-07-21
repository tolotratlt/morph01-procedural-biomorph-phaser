# Theterroot Procedural Animation

A real-time 2D interpretation of a Wolfram biomorph, built with Phaser 4, TypeScript, and Vite. The experience renders 10,000 calculated points as a synthetic organism whose crimson pulse travels upward through its structure.

## Features

* Direct TypeScript adaptation of the original Wolfram equations
* 10,000 animated points rendered through a Phaser Canvas texture
* Traveling red energy bands with additive glow
* Adjustable speed, density, pulse intensity, and trail persistence
* Interactive cycle scrubbing with pointer or touch input
* French and English interface with a persistent language preference
* Responsive layout for desktop and mobile screens

## Requirements

* Node.js 20.19 or newer
* npm 10 or newer

## Installation

```bash
npm install
npm run dev
```

Open the local address displayed by Vite, usually `http://127.0.0.1:5173`.

## Production build

```bash
npm run build
npm run preview
```

The optimized application is generated in the `dist` directory.

## Controls

* Press Space to pause or resume the animation.
* Drag horizontally across the biomorph to explore its cycle.
* Use the FR and EN selector in the header to change the interface language.
* Use the control panel to adjust the animation in real time.

## How the biomorph works

The white particle layer directly evaluates the supplied Wolfram equations for 10,000 values of `x`. Each result is mapped from the original Wolfram plot range into the internal Phaser canvas.

The red region is not a separate shape. It is a periodic wave applied to the normalized particle index. Combining that wave with deterministic particle variation creates moving bands that appear to travel upward like a nerve signal. Previous frames are partially retained to produce organic trails.

## Project structure

```text
src/main.ts       Phaser scene, procedural equations, controls, and translations
src/style.css     Responsive interface and visual system
index.html        Application structure and accessible UI
```

## Technology

* Phaser 4.2.1
* TypeScript 7
* Vite 8
