const rooms = {}; // Yksinkertainen huoneenhallinta

const createRoom = (req, res) => {
    const { roomID } = req.body;

    if (!roomID) {
        return res.status(400).json({ error: "Room ID is required." });
    }

    if (rooms[roomID]) {
        return res.status(400).json({ error: "Room already exists." });
    }

    rooms[roomID] = []; // Luo tyhjä huone
    res.status(201).json({ message: `Room ${roomID} created.` });
};

module.exports = { createRoom };