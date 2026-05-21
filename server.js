const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let mockDatabase = [
    { id: 1, text: "Learn Node.js basics", completed: false, subtasks: []},
    { id: 2, text: "Build an Express API router", completed: false, subtasks: []},
];

app.get('/api/tasks', (req, res) => {
    console.log("Received a GET request to fetch all tasks");
    res.json(mockDatabase);
});

app.post('/api/tasks', (req, res) => {
    console.log("Received a POST request to add a new task:", req.body);
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({error: "Task"});
    }
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        subtasks: []
    };
    mockDatabase.push(newTask);
    res.status(201).json(newTask);
});

app.delete('/api/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    console.log(`Received a DELETE request for task ID: ${taskId}`);

    const taskExists = mockDatabase.some(t => t.id === taskId);
    if (!taskExists) {
        return res.status(404).json({error: "Task not found."});
    }
    mockDatabase = mockDatabase.filter(t => t.id !== taskId);
    res.json({message: "Task successfully deleted from memory cache.", id: taskId });
});

app.listen(PORT, () => {
    console.log(`TaskForge Server is officially blazing hot on http://localhost:${PORT}`);
})