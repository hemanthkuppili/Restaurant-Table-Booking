const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5500;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    picture: String,
    orders: [{
        orderId: String,
        date: String,
        items: [{
            name: String,
            price: Number,
            quantity: Number,
            image: String
        }],
        totalCost: String,
        status: String,
        method: String,
        address: String,
        pickupTime: String,
        paymentMethod: String,
        closed: { type: Boolean, default: false } // Add closed field for previous orders
    }]
});

const User = mongoose.model('User', userSchema);

// API Endpoints

// Get user orders (active and previous)
app.get('/api/users/:googleId/orders', async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.params.googleId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Place a new order
app.post('/api/users/:googleId/orders', async (req, res) => {
    try {
        const order = req.body;
        let user = await User.findOne({ googleId: req.params.googleId });
        if (!user) {
            user = new User({ googleId: req.params.googleId, orders: [order] });
        } else {
            user.orders.push(order);
        }
        await user.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Close an order (mark as previous)
app.put('/api/users/:googleId/orders/:orderId/close', async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.params.googleId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const order = user.orders.find(o => o.orderId === req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.closed = true;
        await user.save();
        res.json({ message: 'Order closed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Initialize user profile
app.post('/api/users', async (req, res) => {
    try {
        const { googleId, name, email, picture } = req.body;
        let user = await User.findOne({ googleId });
        if (!user) {
            user = new User({ googleId, name, email, picture, orders: [] });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));