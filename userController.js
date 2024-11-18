const { createUser, authenticateUser } = require("./dataManager");

// Käyttäjän rekisteröinti
const registerUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Käyttäjänimi ja salasana vaaditaan!" });
    }

    try {
        await createUser(username, password);
        res.status(201).json({ message: `Käyttäjä ${username} luotu onnistuneesti!` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Käyttäjän kirjautuminen
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Käyttäjänimi ja salasana vaaditaan!" });
    }

    try {
        const isAuthenticated = await authenticateUser(username, password);
        if (isAuthenticated) {
            res.status(200).json({ message: `Tervetuloa, ${username}!` });
        } else {
            res.status(401).json({ error: "Virheellinen käyttäjänimi tai salasana." });
        }
    } catch (error) {
        res.status(500).json({ error: "Palvelinvirhe." });
    }
};

module.exports = { registerUser, loginUser };
