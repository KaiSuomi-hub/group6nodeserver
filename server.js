//Server implementation using Express and Socket.IO, with HTTPS support enabled through SSL certificates.
// This server facilitates real - time, bidirectional communication between clients, particularly for WebRTC signaling to
// establish peer - to - peer connections.
const express = require("express");
const http = require("https");
const fs = require("fs");

// Load SSL certificate and key
/**
 * SSL options for creating an HTTPS server.
 *
 * @type {Object}
 * @property {Buffer} key - The private key for SSL, read from the file system.
 * @property {Buffer} cert - The certificate for SSL, read from the file system.
 */
const sslOptions = {
    key: fs.readFileSync("./privatekey.pem"),
    cert: fs.readFileSync("./certificate.pem"),
  };

const app = express();
const server = http.createServer(sslOptions, app);
// Socket.IO is initialized with the HTTPS server to enable real-time communication:
const socket = require("socket.io");
const io = socket(server);
// An empty object rooms is defined to keep track of the rooms and their participants:
const rooms = {};



const port = process.env.PORT || 9000;
// Handling Socket.IO Events:
// The server listens for various Socket.IO events to manage WebRTC signaling:

// Connection Event: When a client connects, a connection event is fired, and a message "Connected" is logged:
io.on("connection", socket => {
    console.log("Connected")
    // Join Room Event: The server listens for a join room event, which is triggered when a client wants to join a specific room:
    socket.on("join room", roomID => {
        console.log("Join room fired", roomID);
        if (rooms[roomID]) {
            console.log("Push")
            rooms[roomID].push(socket.id);
        } else {
            console.log("Create")
            rooms[roomID] = [socket.id];
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if (otherUser) {
            console.log("Other user fired and user joined fired")
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
    });
    // Offer Event: The server listens for an offer event, which is part of the WebRTC signaling process:
    socket.on("offer", payload => {
        console.log("Offer fired", payload)
        io.to(payload.target).emit("offer", payload);
    });
    // Answer Event: The server listens for an answer event, another part of the WebRTC signaling process:
    socket.on("answer", payload => {
        console.log("Answer fired", payload)
        io.to(payload.target).emit("answer", payload);
    });
    // ICE Candidate Event: The server listens for an ice-candidate event, which is used to exchange ICE candidates between peers:
    socket.on("ice-candidate", incoming => {
        console.log("Ice candidate fired");
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });
});



server.listen(port, () => console.log('server is running on port 9000'));


