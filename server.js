const express = require("express");
const http = require("http");
const socket = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static("public"));

let users = {}; // socket.id -> { username }
let usernameToId = {};

io.on("connection", (socket) => {

    socket.on("join", (username) => {
        if (!username || username.length > 20) return;

        users[socket.id] = { username };
        usernameToId[username] = socket.id;

        io.emit("users", Object.values(users).map(u => u.username));

        io.emit("message", {
            user: "System",
            text: `${username} joined`,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on("chatMessage", (msg) => {
        io.emit("message", {
            user: users[socket.id]?.username,
            text: msg,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on("privateMessage", ({ to, msg }) => {
        const target = usernameToId[to];

        if (target) {
            io.to(target).emit("privateMessage", {
                from: users[socket.id].username,
                text: msg
            });
        }
    });

    socket.on("typing", () => {
        socket.broadcast.emit("typing", users[socket.id]?.username);
    });

    socket.on("disconnect", () => {
        const user = users[socket.id]?.username;

        delete usernameToId[user];
        delete users[socket.id];

        io.emit("users", Object.values(users).map(u => u.username));

        io.emit("message", {
            user: "System",
            text: `${user} left`,
            time: new Date().toLocaleTimeString()
        });
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});