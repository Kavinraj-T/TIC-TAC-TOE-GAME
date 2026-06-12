# 🌐 Cyberpunk Multiplayer Tic-Tac-Toe

A beautiful, high-performance, real-time multiplayer Tic-Tac-Toe game powered by **Node.js** and **raw WebSockets (`ws`)**. This project features a zero-dependency frontend wrapped in an ultra-modern cyberpunk glassmorphism UI layout, featuring custom neon styling parameters for both players.

---

## 🚀 Live Demo
Play it online here: **[Insert your Render live URL here]**

---

## ✨ Features

* **Global Matchmaking (Random Match):** An automated matchmaking queue that pairs players globally into rooms as soon as they connect.
* **Custom Room Architecture:** Users can instantiate custom rooms with randomly generated alphanumeric codes and share them with friends to connect instantly.
* **Dynamic Balanced Roles:** The server automatically shakes up starting positions, allocating "X" and "O" statuses dynamically with a 50/50 balance probability.
* **Efficient Disconnect Handling:** Active room cleanups and memory protection loops drop empty sockets and remove deleted instances seamlessly to prevent backend leaks.
* **Cyberpunk Visual Engine:** Handcrafted CSS layout built with glowing text shadows, custom neon theme color variations (Neon Red for X, Neon Blue for O), and cross-browser responsive grids.

---

## 🛠️ Project Structure

```text
xo-websocket-game/
│
├── public/
│   ├── index.html       # Game dashboard client layout & socket renderer
│   └── background.jpg   # Cyberpunk visual background theme asset
│
├── server.js            # Combined HTTP & WebSocket event controller
├── package.json         # Managed project dependency parameters
└── .gitignore           # Excludes heavy node modules from storage syncing
