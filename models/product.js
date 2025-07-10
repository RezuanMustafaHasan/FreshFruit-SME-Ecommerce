const mongoose = require('mongoose');
const Review = require('./review'); 

const Schema = mongoose.Schema;

const defaultImage = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const productSchema = new Schema({
    category: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {  // Now accepts an object
        filename: String,
        url: String,
    },
    price: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

// listingSchema.post('findOneAndDelete', async (listing)=>{
//     if(listing){
//         await Review.deleteMany({ _id: { $in: listing.reviews } });
//     }
// });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

/*
    image:{
        type: String,
        set: (v) => (v==='')? defaultImage : v,
        default: defaultImage
    }
*/