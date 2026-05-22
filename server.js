require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI).then(() => console.log("MongoDB online."));

const Task = mongoose.model('Task', new mongoose.Schema({ text: { type: String, required: true, trim: true, index: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now } }));

const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false 
},
});

redisClient.on('error', (err) => console.error('Redis Engine Connection Failure:', err));
redisClient.connect().then(() => console.log("Redis In-Memory Cache Core Online!"));

app.get('/api/tasks', async (req, res) => {
    try {
        console.log("Checking Redis memory pools for 'tasks_cache' key...");
        
        const cachedTasks = await redisClient.get('tasks_cache');

        if (cachedTasks) {
            console.log("CACHE HIT! Serving data directly out of RAM instant arrays.");
            return res.json(JSON.parse(cachedTasks));
        }

        console.log("CACHE MISS! Falling back to permanent MongoDB database disk...");
        const dbTasks = await Task.find();

        await redisClient.setEx('tasks_cache', 60, JSON.stringify(dbTasks));

        res.json(dbTasks);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task({ text: req.body.text, completed: false });
        await newTask.save();

        await redisClient.del('tasks_cache');
        console.log("Stale cache wiped out cleanly.");

        io.emit('task_created', newTask);
        res.status(201).json(newTask);
    } catch (err) { res.status(500).json(err); }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        
        await redisClient.del('tasks_cache');
        console.log("Stale cache wiped out clean on item purge.");

        io.emit('task_deleted', req.params.id);
        res.json({ message: "Purged." });
    } catch (err) { res.status(500).json(err); }
});

server.listen(PORT, () => console.log(`TaskForge Backbone running on port ${PORT}`));