const express = require('express');
const router = express.Router({mergeParams: true});
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError.js');
const Product = require('../models/product.js');
const Order = require('../models/orders.js');
const User = require('../models/user.js');
const Delivered = require('../models/deliverd.js');

const multer = require('multer');
const {storage} = require('../cloudConfig.js');
const upload = multer({ storage });



router.get("/", async (req, res) => {
    const allProducts = await Product.find({});
    res.render('admin-products', { allProducts });
});

router.get('/products',  wrapAsync( async (req, res) => {
    const allProducts = await Product.find({});
    res.render('admin-products', { allProducts });
}));
router.get("/add-products", (req, res) => {
    res.render("admin-add-product");
});

router.get("/login", (req, res) => {
    res.render("admin-login");
});

router.post("/login",  (req, res) => {
    console.log("Login successful");
    res.redirect("/admin/products");
});

router.post('/', upload.single('product[image]'), wrapAsync(async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newProduct = new Product(req.body.product);
    newProduct.image.url = url;
    newProduct.image.filename = filename;
    console.log(newProduct);
    await newProduct.save();
    res.redirect('/admin/products');
}));

// GET route for edit product page
router.get('/edit-product/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/admin/products');
    }
    res.render('admin-edit-product', { product });
}));

// PUT route for updating product
router.put('/edit-product/:id', upload.single('product[image]'), wrapAsync(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { ...req.body.product }, { new: true });
    
    if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/admin/products');
    }
    
    // Update image if new one is uploaded
    if (req.file) {
        product.image.url = req.file.path;
        product.image.filename = req.file.filename;
        await product.save();
    }
    
    req.flash('success', 'Product updated successfully!');
    res.redirect('/admin/products');
}));

// DELETE route for deleting product
router.delete('/delete-product/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
        req.flash('error', 'Product not found');
        return res.redirect('/admin/products');
    }
    
    req.flash('success', 'Product deleted successfully!');
    res.redirect('/admin/products');
}));



// Orders routes
router.get('/orders', wrapAsync(async (req, res) => {
    // Get pending orders from orders collection
    const pendingOrders = await Order.find({})
        .populate('user', 'username email')
        .populate('product');
    
    // Get delivered orders from delivered collection
    const deliveredOrders = await Delivered.find({})
        .populate('user', 'username email')
        .populate('product');
    
    // Calculate total sales from delivered orders with null checks
    const totalSales = deliveredOrders.reduce((total, order) => {
        // Only add to total if product exists and has a price
        if (order.product && order.product.price) {
            return total + (order.product.price * order.quantity);
        }
        return total;
    }, 0);
    
    res.render('admin-order', { 
        pendingOrders, 
        deliveredOrders, 
        totalSales 
    });
}));

// Route to mark order as delivered
router.post('/orders/deliver/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    
    // Find the pending order
    const pendingOrder = await Order.findById(id).populate('user').populate('product');
    
    if (!pendingOrder) {
        req.flash('error', 'Order not found');
        return res.redirect('/admin/orders');
    }
    
    // Check if product exists and has sufficient stock
    if (!pendingOrder.product) {
        req.flash('error', 'Product not found');
        return res.redirect('/admin/orders');
    }
    
    if (pendingOrder.product.stock < pendingOrder.quantity) {
        req.flash('error', 'Insufficient stock for this order');
        return res.redirect('/admin/orders');
    }
    
    // Update product stock
    await Product.findByIdAndUpdate(
        pendingOrder.product._id,
        { $inc: { stock: -pendingOrder.quantity } }
    );
    
    // Create delivered order record
    const deliveredOrder = new Delivered({
        user: pendingOrder.user._id,
        product: pendingOrder.product._id,
        quantity: pendingOrder.quantity
    });
    
    await deliveredOrder.save();
    
    // Update user's pending_orders and delivered_orders
    const user = await User.findById(pendingOrder.user._id);
    
    // Remove from pending_orders
    user.pending_orders = user.pending_orders.filter(order => 
        !order.product.equals(pendingOrder.product._id) || 
        order.quantity !== pendingOrder.quantity
    );
    
    // Add to delivered_orders or update quantity if exists
    const existingDeliveredIndex = user.delivered_orders.findIndex(order => 
        order.product.equals(pendingOrder.product._id)
    );
    
    if (existingDeliveredIndex !== -1) {
        user.delivered_orders[existingDeliveredIndex].quantity += pendingOrder.quantity;
    } else {
        user.delivered_orders.push({
            product: pendingOrder.product._id,
            quantity: pendingOrder.quantity
        });
    }
    
    await user.save();
    
    // Remove from orders collection
    await Order.findByIdAndDelete(id);
    
    req.flash('success', 'Order marked as delivered successfully!');
    res.redirect('/admin/orders');
}));

// Don't forget to export the router
module.exports = router;