require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🔌 Database connected for advanced logic routing."))
    .catch((err) => console.error("❌ Database connection error:", err));

const SubtaskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    subtasks: [SubtaskSchema], 
    createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', TaskSchema);

function quickSortEngine(arr) {
    if (arr.length <= 1) return arr;

    const pivotIndex = Math.floor(arr.length / 2);
    const pivot = arr[pivotIndex];
    
    const left = [];
    const right = [];
    const equal = [];

    for (let task of arr) {
        if (task.text.length < pivot.text.length) {
            left.push(task);
        } else if (task.text.length > pivot.text.length) {
            right.push(task);
        } else {
            equal.push(task);
        }
    }

    return [...quickSortEngine(left), ...equal, ...quickSortEngine(right)];
}

app.get('/api/tasks', async (req, res) => {
    try {
        let tasks = await Task.find();

        if (req.query.sort === 'length') {
            console.log("⚡ Executing Backend Quick Sort Algorithm...");
            tasks = quickSortEngine(tasks);
        }

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to process task data." });
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
        res.status(500).json({ error: "Database rejected task creation." });
    }
});

app.post('/api/tasks/:id/subtasks', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: "Subtask text is required." });

        const parentTask = await Task.findById(req.params.id);
        if (!parentTask) return res.status(404).json({ error: "Parent task not found." });

        parentTask.subtasks.push({ text });
        await parentTask.save();

        res.status(201).json(parentTask);
    } catch (err) {
        res.status(500).json({ error: "Failed to insert tree subtask node." });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) return res.status(404).json({ error: "Task not found." });
        res.json({ message: "Task dropped successfully.", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: "Failed to execute database wipe operation." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 TaskForge Logical API Server active on port ${PORT}`);
});