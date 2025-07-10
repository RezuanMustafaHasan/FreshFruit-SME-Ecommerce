# FreshFruit SME E-commerce Platform

A full-stack e-commerce web application built with Node.js, Express, and MongoDB for selling fresh fruits online. This platform provides both customer-facing features and admin management capabilities.

## 🚀 Features

### Customer Features
- **User Authentication**: Secure signup/login system with Passport.js
- **Product Browsing**: Browse through a variety of fresh fruits
- **Shopping Cart**: Add products to cart and manage quantities
- **Order Management**: Place orders and track order status
- **Order History**: View pending and delivered orders
- **Responsive Design**: Mobile-friendly interface

### Admin Features
- **Product Management**: Add, edit, and delete products
- **Image Upload**: Upload product images via Cloudinary
- **Order Management**: View and process customer orders
- **Inventory Control**: Manage product stock levels
- **Sales Analytics**: Track total sales and order statistics
- **Order Fulfillment**: Mark orders as delivered

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with Local Strategy
- **Template Engine**: EJS with EJS-Mate
- **File Upload**: Multer with Cloudinary storage
- **Session Management**: Express-session with MongoDB store
- **Styling**: Bootstrap 5, Custom CSS
- **Development**: Nodemon, LiveReload

## 📦 Dependencies

### Main Dependencies
```json
{
  "cloudinary": "^1.41.3",
  "connect-flash": "^0.1.1",
  "connect-mongo": "^5.1.0",
  "express": "^5.1.0",
  "mongoose": "^8.16.0",
  "passport": "^0.7.0",
  "passport-local-mongoose": "^8.0.0",
  "multer": "^2.0.1",
  "ejs": "^3.1.10"
}
```