const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/admin'); // Make sure this uses passport-local-mongoose

const MONGO_URL = 'mongodb://127.0.0.1:27017/CVIT-SME';

// Database connection
mongoose.connect(MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));


app.get('/', (req, res) => {
    res.send("Welcome to the CVIT SME Admin Panel");
});

app.get("/demouser", async (req, res) => {
    try {
        let oneUser = new User({
            username: "cvit-admin"
        });
        let registeredUser = await User.register(oneUser, "password123");
        console.log(registeredUser);
        res.send(registeredUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering user");
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});