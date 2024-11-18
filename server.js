const express = require("express");
const http = require("http"); // Muutettu https:sta http:ksi
const fs = require("fs");
const socket = require("socket.io");
const { registerUser, loginUser } = require("./userController"); // Käyttäjähallinta
const { createRoom, joinRoom } = require("./roomController"); // Huoneenhallinta

require("dotenv").config();

// SSL-konfiguraatio (kommentoitu pois paikallista kehitystä varten)
// const sslOptions = {
//     key: fs.readFileSync("privatekey.pem"),
//     cert: fs.readFileSync("certificate.pem"),
// };

const app = express();

// Käytetään HTTP:ta ilman SSL:ää paikallisessa kehityksessä
// Jos haluat käyttää SSL:ää, käytä https.createServer(sslOptions, app)
// const server = http.createServer(sslOptions, app);  // SSL version
const server = http.createServer(app); // HTTP version ilman SSL:ää

// Alustetaan io (Socket.IO)
const io = socket(server);

// Middleware JSON-pyyntöjen käsittelyyn
app.use(express.json());

const port = process.env.PORT || 9000;

// Käyttäjänhallinnan REST API
app.post("/register", registerUser);
app.post("/login", loginUser);

// Huoneenhallinnan REST API
app.post("/create-room", createRoom);

// Socket.IO Signaling WebRTC
const rooms = {};

io.on("connection", (socket) => {
    console.log("Connected");

    socket.on("join room", (roomID) => {
        console.log("Join room fired", roomID);
        if (rooms[roomID]) {
            console.log("Push");
            rooms[roomID].push(socket.id);
        } else {
            console.log("Create");
            rooms[roomID] = [socket.id];
        }
        const otherUser = rooms[roomID].find((id) => id !== socket.id);
        if (otherUser) {
            console.log("Other user fired and user joined fired");
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
    });

    socket.on("offer", (payload) => {
        console.log("Offer fired", payload);
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
        console.log("Answer fired", payload);
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (incoming) => {
        console.log("Ice candidate fired");
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });
});

server.listen(port, () => console.log(`Server is running on port ${port}`));