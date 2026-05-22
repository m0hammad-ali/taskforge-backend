require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI).then(() => console.log("🔌 Secured Database mounted."));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const SecureTaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, index: true },
    completed: { type: Boolean, default: false }
});
const SecureTask = mongoose.model('SecureTask', SecureTaskSchema);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access Denied: Security authentication badge required." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden: Signature tampered with or expired." });
        req.user = user; 
        next();
    });
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Missing identity credentials." });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "Identity created securely." });
    } catch (err) { res.status(500).json({ error: "Username choice conflict." }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Account details match not found." });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid password match." });

        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (err) { res.status(500).json(err); }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await SecureTask.find({ userId: req.user.userId });
        res.json(tasks);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const newTask = new SecureTask({
            text: req.body.text,
            userId: req.user.userId 
        });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) { res.status(500).json(err); }
});

server.listen(PORT, () => console.log(`TaskForge Secure Engine running on port ${PORT}`));