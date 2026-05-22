require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 50
});

const Task = mongoose.model('Task', new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}));

async function seedSystem() {
    console.log("WARNING: Starting stress test generation engine...");
    console.log("Connecting to cloud cluster database...");
    
    const totalRecords = 1000000;
    const batchSize = 20000;
    
    try {
        await Task.deleteMany({});
        console.log("Previous task collections wiped clean.");

        const startTime = Date.now();

        for (let i = 0; i < totalRecords; i += batchSize) {
            let batch = [];
            for (let j = 0; j < batchSize; j++) {
                const taskNum = i + j;
                batch.push({
                    text: `TaskForge systemic automated production deployment blueprint string tracking index code record number ${taskNum}`,
                    completed: Math.random() > 0.5
                });
            }
            await Task.insertMany(batch);
            console.log(`Bulk buffered insertion successful: Chonked ${i + batchSize} / ${totalRecords} documents...`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`SUCCESS! Filled MongoDB cloud vault with ${totalRecords} records in ${duration}s.`);
        process.exit(0);
    } catch (err) {
        console.error("Seed execution crashed:", err);
        process.exit(1);
    }
}

seedSystem();