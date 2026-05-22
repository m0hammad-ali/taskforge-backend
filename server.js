require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🔌 Connected to cloud MongoDB Atlas database successfully!"))
    .catch((err) => console.error("❌ Database connection error:", err));

const TaskSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', TaskSchema);

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks from database." });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Text field is required." });

        const newTask = new Task({ text });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ error: "Database rejected task creation payload." });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) return res.status(404).json({ error: "Task not found." });
        
        res.json({ message: "Task dropped from database storage.", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: "Database failed to process deletion request." });
    }
});

app.listen(PORT, () => {
    console.log(`TaskForge Network Backbone active on http://localhost:${PORT}`);
});