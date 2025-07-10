//1
if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
} 
const express = require('express');
const app = express();
const Review = require('./models/review');
const path = require('path');
const mongoose = require('mongoose');
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport');
const User = require('./models/user');
const LocalStrategy = require('passport-local');

const methodOverride = require('method-override');

const Product = require('./models/product.js');
const Order = require('./models/orders.js');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const ejsMate = require('ejs-mate');
app.engine('ejs', ejsMate);
const { saveRedirectUrl } = require('./middlewares.js');

const MONGO_URL = 'mongodb://127.0.0.1:27017/CVIT-SME';

// Update session configuration
const MongoStore = require('connect-mongo');

const sessionOptions = {
    secret: "mysupersecretstring",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URL,
        touchAfter: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
};

main()
.then(()=>{
    console.log("Connected to DB");
})
.catch(err=>{
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser((user, done) => {
    console.log("Serializing user:", user);
    User.serializeUser()(user, done);
});

passport.deserializeUser((id, done) => {
    console.log("Deserializing user ID:", id);
    User.deserializeUser()(id, done);
});

// Debug middleware - PLACE BEFORE ROUTES
app.use((req, res, next) => {
    console.log("Request Session ID:", req.sessionID);
    console.log("Request Session:", req.session);
    
    const oldEnd = res.end;
    res.end = function() {
        console.log('Response ending - Session:', req.session);
        return oldEnd.apply(this, arguments);
    };
    
    next();
});


app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    console.log("Middleware - req.user:", req.user);
    console.log("Middleware - req.isAuthenticated():", req.isAuthenticated());
    next();
});

// Remove this line
// app.use('/admin', adminRouter);

app.get('/', async (req, res) => {
    console.log('Home route - currUser:', res.locals.currUser); // Debug log
    const featuredProducts = await Product.find({}).limit(3);
    res.render('index', { featuredProducts });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/shop', async (req, res) => {
    console.log('From Shop - req.user:', req.user);
    console.log("Shop - Session ID:", req.sessionID);
    console.log("Shop - Session:", req.session);
    const allProducts = await Product.find({});
    res.render('shop', { allProducts});
});

app.get("/cart", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to view your cart');
        return res.redirect('/login');
    }
    
    const user = await User.findById(req.user._id)
        .populate('orders.product')
        .populate('pending_orders.product')
        .populate('delivered_orders.product');
    
    const orders = user.orders || [];
    const pendingOrders = user.pending_orders || [];
    const deliveredOrders = user.delivered_orders || [];
    
    res.render("cart", { orders, pendingOrders, deliveredOrders });
}));

app.post("/signup", wrapAsync(async (req, res, next) => {
    try{
        console.log(req.body);
        const { name, username, email, address, phone, password  } = req.body;
        const newUser = new User({ name, username, email, address, phone });
        const registeredUser = await User.register(newUser, password);
        console.log('Registered user:', registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'Welcome to FruitMart!');
            console.log('User Signed Up successfully');
            res.redirect('/shop');
        });
        
    } catch (e) {
        console.log('Signup error:', e);
        req.flash('error', e.message);
        res.redirect('/signup');
    }
}));



app.post("/login", saveRedirectUrl, passport.authenticate("local", {failureRedirect: '/login', failureFlash: true}), (req, res) => {
    req.flash('success', 'Welcome back!');
    console.log("Login successful - User:", req.user);
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    
    // Force session save before redirect
    req.session.save((err) => {
        if (err) {
            console.error("Session save error:", err);
            return res.redirect('/login');
        }
        res.redirect('/shop');
    });
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            next(err);
        }
        if(!req.user) console.log("logged out");
        if(!req.user) req.flash('success', 'You have successfully logged out!');
        res.redirect('/shop');
    });
});
app.get("/cart/add/:id", wrapAsync(async (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to add items to cart');
        return res.redirect('/login');
    }
    
    const { id } = req.params;
    if (!id) {
        req.flash('error', 'Product ID is required');
        return res.redirect('/shop');
    }
    const product = await Product.findById(id);
    console.log("product is here = ", product);
    
    if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/shop');
    }
    if (product.stock <= 0) {
        req.flash('error', 'Product is out of stock');
        return res.redirect('/shop');
    }
    const user = await User.findById(req.user._id);
    
    if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/login');
    }
    const existingOrderIndex = user.orders.findIndex(
        order => order.product.toString() === id
    );
    
    if (existingOrderIndex !== -1) {
        user.orders[existingOrderIndex].quantity += 1;
    } else {
        user.orders.push({
            product: id,
            quantity: 1
        });
    }
    await user.save();
    req.flash('success', `${product.name} added to cart successfully!`);
    res.redirect('/shop');
}));

app.get('/about', (req, res) => {
    res.render('about');
});

// Add checkout route
app.post("/checkout", wrapAsync(async (req, res) => {
    
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to checkout');
        return res.redirect('/login');
    }
    
    const user = await User.findById(req.user._id).populate('orders.product');
    
    if (!user) {
        req.flash('error', 'User not found');
        return res.redirect('/login');
    }
    
    if (!user.orders || user.orders.length === 0) {
        req.flash('error', 'Your cart is empty');
        return res.redirect('/cart');
    }
    
    try {
        // Create Order documents in database
        const orderPromises = user.orders.map(async (cartItem) => {
            const order = new Order({
                user: user._id,
                product: cartItem.product._id,
                quantity: cartItem.quantity
            });
            return await order.save();
        });
        
        await Promise.all(orderPromises);
        
        // Move items from orders to pending_orders
        if (!user.pending_orders) {
            user.pending_orders = [];
        }
        
        user.orders.forEach(cartItem => {
            // Check if product already exists in pending_orders
            const existingPendingIndex = user.pending_orders.findIndex(
                pending => pending.product.toString() === cartItem.product._id.toString()
            );
            
            if (existingPendingIndex !== -1) {
                // Update quantity if product already exists in pending_orders
                user.pending_orders[existingPendingIndex].quantity += cartItem.quantity;
            } else {
                // Add new item to pending_orders
                user.pending_orders.push({
                    product: cartItem.product._id,
                    quantity: cartItem.quantity
                });
            }
        });
        
        // Clear the cart (orders array)
        user.orders = [];
        
        // Save user changes
        await user.save();
        
        req.flash('success', 'Order placed successfully! Your items have been moved to pending orders.');
        res.redirect('/cart');
        
    } catch (error) {
        console.error('Checkout error:', error);
        req.flash('error', 'An error occurred during checkout. Please try again.');
        res.redirect('/cart');
    }
}));
const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

app.listen(3000, () => console.log('Server running on port 3000'));
// Add this after your other middleware
