const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const socket = require("socket.io");
const { registerUser, loginUser } = require("./userController"); // Käyttäjähallinta
const { createRoom, listRooms } = require("./roomController"); // Huoneenhallinta
const cors = require('cors');

const app = express();

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

require("dotenv").config();

SSL-konfiguraatio //(vain jos käytetään omaa sertifikaattia)
const sslOptions = process.env.SSL_ENABLED === 'true' ? {
  key: fs.readFileSync("privatekey.pem"),
  cert: fs.readFileSync("certificate.pem"),
} : {};

//Jos käytetään Renderin tarjoamaa HTTPS:ää, tämä osa voi olla tarpeeton
const server = sslOptions.key && sslOptions.cert ? 
https.createServer(sslOptions, app) : 
http.createServer(app); // Jos SSL ei ole käytössä, käytetään HTTP:tä

//paikallinen testaus
//const server = http.createServer(app);

// Alustetaan Socket.IO
const io = socket(server);

// Middleware JSON-pyyntöjen käsittelyyn
app.use(express.json());

const port = process.env.PORT||10000;

// Käyttäjänhallinnan reitit
app.post(["/register", "/api/register"], registerUser);
app.post(["/login", "/api/login"], loginUser);

// Huoneenhallinnan reitit
app.post("/create-room", createRoom);
app.get("/rooms", listRooms);  // Reitti huoneiden listaamiseen

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

// Käynnistetään serveri
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
