require('dotenv').config();  // Lataa ympäristömuuttujat .env-tiedostosta
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Ladataan ympäristömuuttuja salausavaimelle
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 tavun avain heksadesimaali
const IV_LENGTH = 16;  // IV (alustava vektori) on 16 tavua

// Polku datatiedostoon
const dataFilePath = path.join(__dirname, "data.json");

// Tarkistetaan, onko salausavain asetettu ympäristömuuttujaan
if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY ympäristömuuttuja ei ole asetettu.");
}

// Funktio, joka lataa ja purkaa salatun datan
const readData = () => {
    try {
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
    } catch (error) {
        console.error("Virhe salatun datan lukemisessa:", error);
        throw new Error("Virhe salatun datan lukemisessa.");
    }
};

// Funktio, joka salaa ja tallentaa tiedot
const writeData = (data) => {
    try {
        const iv = crypto.randomBytes(IV_LENGTH); // Luodaan satunnainen IV
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
        
        let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
        encrypted += cipher.final("hex");

        // Tallennetaan salattu data tiedostoon
        const encryptedData = JSON.stringify({ iv: iv.toString("hex"), content: encrypted });
        fs.writeFileSync(dataFilePath, encryptedData, "utf8");
    } catch (error) {
        console.error("Virhe salatun datan kirjoittamisessa:", error);
        throw new Error("Virhe salatun datan kirjoittamisessa.");
    }
};

// Funktio käyttäjän luomiseen
const createUser = async (username, password) => {
    const data = readData(); // Lataa tiedot

    // Tarkistetaan, onko käyttäjä jo olemassa
    if (data.users[username]) {
        throw new Error("Käyttäjä on jo olemassa.");
    }

    // Salataan salasana
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex'); // Voit käyttää esimerkiksi bcryptia turvallisemman salauksen luomiseksi

    // Lisätään uusi käyttäjä
    data.users[username] = { password: hashedPassword };

    // Tallennetaan data
    writeData(data);
};

// Funktio käyttäjän tunnistamiseen
const authenticateUser = async (username, password) => {
    const data = readData(); // Lataa tiedot

    // Tarkistetaan, onko käyttäjä olemassa
    if (!data.users[username]) {
        return false;
    }

    // Verrataan salasanaa (täällä käytämme sha256, mutta suosittelen bcryptia salasanan tarkistamiseen)
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // Verrataan tallennettua salasanaa ja käyttäjän antamaa salasanaa
    return data.users[username].password === hashedPassword;
};

module.exports = { readData, writeData, createUser, authenticateUser }; 