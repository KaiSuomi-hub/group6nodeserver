const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "data.json");

const readData = () => {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath, "utf8");
        return JSON.parse(data);
    }
    return { rooms: {}, users: {} };
};

const writeData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
};

module.exports = { readData, writeData };