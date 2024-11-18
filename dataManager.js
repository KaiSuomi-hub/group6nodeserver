const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Ladataan ympäristömuuttuja salausavaimelle
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;  // 32 tavun avain heksadesimaali
const IV_LENGTH = 16;  // IV (alustava vektori) on 16 tavua

// Polku datatiedostoon
const dataFilePath = path.join(__dirname, "data.json");

// Funktio, joka lataa ja purkaa salatun datan
const readData = () => {
    if (fs.existsSync(dataFilePath)) {
        const encryptedData = fs.readFileSync(dataFilePath, "utf8");
        const { iv, content } = JSON.parse(encryptedData);

        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.from(iv, "hex"));
        let decrypted = decipher.update(content, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return JSON.parse(decrypted); // Palautetaan purettu data
    }

    // Palautetaan tyhjä data, jos tiedostoa ei ole
    return { rooms: {}, users: {} };
};

// Funktio, joka salaa ja tallentaa tiedot
const writeData = (data) => {
    const iv = crypto.randomBytes(IV_LENGTH); // Luodaan satunnainen IV
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");

    // Tallennetaan salattu data tiedostoon
    const encryptedData = JSON.stringify({ iv: iv.toString("hex"), content: encrypted });
    fs.writeFileSync(dataFilePath, encryptedData, "utf8");
};

module.exports = { readData, writeData };