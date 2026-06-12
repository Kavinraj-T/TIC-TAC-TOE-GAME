const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Render assigns a random port dynamically via process.env.PORT. Fallback to 8080 locally.
const PORT = process.env.PORT || 8080;

// Create a basic HTTP web server to serve your frontend files from a /public folder
const server = http.createServer((req, res) => {
    // Translates the web request URL to a file path inside your local /public folder
    let filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
        } else {
            let ext = path.extname(filePath);
            let contentType = "text/html";
            if (ext === ".css") contentType = "text/css";
            if (ext === ".js") contentType = "text/javascript";
            if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
            if (ext === ".png") contentType = "image/png";
            
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        }
    });
});

// Attach your WebSocket server directly to the HTTP web server instead of a standalone port
const wss = new WebSocketServer({ server });

console.log(`WebSocket Server running on port ${PORT}`);

let waitingPlayer = null;
let rooms = {};

// Generate Room Code
function generateRoomCode() {
    let code;
    do {
        code = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
    } while (rooms[code]);

    return code;
}

wss.on("connection", (ws) => {
    console.log("New player connected");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            // --------------------
            // RANDOM MATCH
            // --------------------
            if (data.type === "random-match") {
                if (!waitingPlayer) {
                    waitingPlayer = ws;
                    ws.send(JSON.stringify({
                        type: "waiting"
                    }));
                } else {
                    const roomCode = generateRoomCode();

                    rooms[roomCode] = {
                        players: [waitingPlayer, ws]
                    };

                    waitingPlayer.roomCode = roomCode;
                    ws.roomCode = roomCode;

                    // Randomly assign who gets X and O
                    const firstRole = Math.random() < 0.5 ? "X" : "O";
                    const secondRole = firstRole === "X" ? "O" : "X";

                    waitingPlayer.send(JSON.stringify({
                        type: "start",
                        role: firstRole,
                        roomCode
                    }));

                    ws.send(JSON.stringify({
                        type: "start",
                        role: secondRole,
                        roomCode
                    }));

                    waitingPlayer = null;
                }
            }

            // --------------------
            // CREATE ROOM
            // --------------------
            else if (data.type === "create-room") {
                const roomCode = generateRoomCode();

                rooms[roomCode] = {
                    players: [ws]
                };

                ws.roomCode = roomCode;

                ws.send(JSON.stringify({
                    type: "room-created",
                    roomCode
                }));

                console.log(`Room Created: ${roomCode}`);
            }

            // --------------------
            // JOIN ROOM
            // --------------------
            else if (data.type === "join-room") {
                const room = rooms[data.roomCode];

                if (!room) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Room not found. Check the code and try again."
                    }));
                    return;
                }

                if (room.players.length >= 2) {
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "This room is already full!"
                    }));
                    return;
                }

                room.players.push(ws);
                ws.roomCode = data.roomCode;

                // Balanced Role Logic: Make X and O assignments dynamic for custom rooms too
                const firstRole = Math.random() < 0.5 ? "X" : "O";
                const secondRole = firstRole === "X" ? "O" : "X";

                room.players[0].send(JSON.stringify({
                    type: "start",
                    role: firstRole,
                    roomCode: data.roomCode
                }));

                room.players[1].send(JSON.stringify({
                    type: "start",
                    role: secondRole,
                    roomCode: data.roomCode
                }));

                console.log(`Room ${data.roomCode} matched and started`);
            }

            // --------------------
            // PLAYER MOVE
            // --------------------
            else if (data.type === "move") {
                const room = rooms[ws.roomCode];
                if (!room) return;

                room.players.forEach(player => {
                    if (
                        player !== ws &&
                        player.readyState === 1 // WebSocket.OPEN
                    ) {
                        player.send(JSON.stringify({
                            type: "opponent-move",
                            index: data.index
                        }));
                    }
                });
            }
        } catch (err) {
            console.error("Failed to process message:", err);
        }
    });

    // --------------------
    // DISCONNECT CLEANUP
    // --------------------
    ws.on("close", () => {
        console.log("Player disconnected");

        // Remove from global matchmaking pool if applicable
        if (waitingPlayer === ws) {
            waitingPlayer = null;
        }

        const roomCode = ws.roomCode;
        if (!roomCode || !rooms[roomCode]) return;

        const room = rooms[roomCode];

        // Filter out the disconnected socket
        room.players = room.players.filter(player => player !== ws);

        // Alert remaining players to reload cleanly
        room.players.forEach(player => {
            if (player.readyState === 1) {
                player.send(JSON.stringify({
                    type: "reset",
                    message: "Opponent left the match! Returning to lobby."
                }));
            }
        });

        // Destroy room entirely once it's empty
        if (room.players.length === 0) {
            delete rooms[roomCode];
            console.log(`Room ${roomCode} completely closed.`);
        }
    });
});

// Start listening for web traffic and WebSocket signals on the hosting port
server.listen(PORT);