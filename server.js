const express = require("express");
const http = require("https");
const fs = require("fs");
const { readData, writeData } = require("./dataManager");

const sslOptions = {
    key: fs.readFileSync("privatekey.pem"),
    cert: fs.readFileSync("certificate.pem"),
};

const app = express();
const server = http.createServer(sslOptions, app);
const socket = require("socket.io");
const io = socket(server);

const port = process.env.PORT || 9000;

let data = readData();  // Ladataan tiedot tiedostosta

io.on("connection", (socket) => {
    console.log("Connected");

    // Lisätään käyttäjä
    data.users[socket.id] = { username: `User_${socket.id}` };
    writeData(data); // Tallennetaan tiedot

    socket.on("join room", (roomID) => {
        console.log("Join room fired", roomID);

        // Lisätään käyttäjä huoneeseen
        if (data.rooms[roomID]) {
            data.rooms[roomID].push(socket.id);
        } else {
            data.rooms[roomID] = [socket.id];
        }
        writeData(data); // Tallennetaan tiedot

        // Etsitään toinen käyttäjä huoneessa ja ilmoitetaan
        const otherUser = data.rooms[roomID].find((id) => id !== socket.id);
        if (otherUser) {
            console.log("Other user fired and user joined fired");
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
    });

    // WebRTC-signalisointi
    socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (incoming) => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });

    // Poistetaan käyttäjä huoneista ja tietokannasta yhteyden katkaisemisen yhteydessä
    socket.on("disconnect", () => {
        console.log("Disconnected");

        // Poistetaan käyttäjä kaikista huoneista
        for (const roomID of Object.keys(data.rooms)) {
            data.rooms[roomID] = data.rooms[roomID].filter(id => id !== socket.id);
            if (data.rooms[roomID].length === 0) {
                delete data.rooms[roomID]; // Poistetaan huone, jos siinä ei ole enää käyttäjiä
            }
        }

        // Poistetaan käyttäjä käyttäjistä
        delete data.users[socket.id];
        writeData(data); // Tallennetaan tiedot
    });
});

server.listen(port, () => console.log("Server is running on port 9000"));