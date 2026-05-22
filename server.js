require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🔌 Database connected for WebSocket runtime distribution."))
    .catch((err) => console.error("❌ Database error:", err));

const SubtaskSchema = new mongoose.Schema({ text: String });
const TaskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    subtasks: [SubtaskSchema]
});
const Task = mongoose.model('Task', TaskSchema);

io.on('connection', (socket) => {
    console.log(`🌐 A user connected to real-time sync network. Socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`🔌 User dropped real-time connection stream.`);
    });
});

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({ text: req.body.text });
        await newTask.save();

        io.emit('task_created', newTask);

        res.status(201).json(newTask);
    } catch (err) { res.status(500).json(err); }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) return res.status(404).json({ error: "Not found" });

        io.emit('task_deleted', req.params.id);

        res.json({ message: "Wiped clean." });
    } catch (err) { res.status(500).json(err); }
});

server.listen(PORT, () => {
    console.log(`Real-Time TaskForge Backbone streaming live on port ${PORT}`);
});