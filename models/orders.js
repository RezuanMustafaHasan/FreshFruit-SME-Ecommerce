const mongoose = require('mongoose');
const User = require('./user'); 

const Schema = mongoose.Schema;

const defaultImage = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    product: 
    {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity:
    {
        type: Number,
        min: 1
    }
});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

/*
    image:{
        type: String,
        set: (v) => (v==='')? defaultImage : v,
        default: defaultImage
    }
*/