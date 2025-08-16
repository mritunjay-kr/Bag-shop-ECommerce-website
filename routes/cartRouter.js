const express = require("express");
const router = express.Router();
const Cart = require("../models/cart-model");
const Product = require("../models/product-model");

// Increase quantity
router.post("/increase/:productId", async (req, res) => {
    try {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return res.json({ success: false });

        const item = cart.products.find(p => p.product.toString() === req.params.productId);
        if (item) item.quantity += 1;
        await cart.save();

        const total = (item.quantity * (await Product.findById(item.product)).price);
        const summary = await getCartSummary(userId);

        res.json({ success: true, quantity: item.quantity, total, summary });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Decrease quantity
router.post("/decrease/:productId", async (req, res) => {
    try {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return res.json({ success: false });

        const itemIndex = cart.products.findIndex(p => p.product.toString() === req.params.productId);
        if (itemIndex === -1) return res.json({ success: false });

        if(cart.products[itemIndex].quantity > 1){
            cart.products[itemIndex].quantity -= 1;
        } else {
            cart.products.splice(itemIndex, 1);
        }
        await cart.save();

        const item = cart.products.find(p => p.product.toString() === req.params.productId);
        const total = item ? item.quantity * (await Product.findById(item.product)).price : 0;
        const summary = await getCartSummary(userId);

        res.json({ success: true, quantity: item ? item.quantity : 0, total, summary });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper function for summary
async function getCartSummary(userId){
    const cart = await Cart.findOne({ user: userId }).populate("products.product");
    const totalMRP = cart.products.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    const totalDiscount = cart.products.reduce((acc, i) => acc + ((i.product.discount || 0) * i.quantity), 0);
    const grandTotal = totalMRP - totalDiscount + 20; // Platform fee
    return { totalMRP, totalDiscount, grandTotal };
}

module.exports = router;
