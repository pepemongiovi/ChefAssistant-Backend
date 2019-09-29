const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { 
        type: String, 
        unique: true, 
        required: true 
    },
    hash: { 
        type: String, 
        required: true 
    },
    createdDate: { 
        type: Date, 
        default: Date.now 
    },
    favoriteRecipes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        required: false,
        default: [],
        ref: 'Recipe'
    }],
    ignoredRecipes: [{
        type: mongoose.Schema.Types.ObjectId, 
        required: false,
        default: [],
        ref: 'Recipe'
    }]
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', schema);