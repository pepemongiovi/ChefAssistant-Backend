const mongoose =  require('mongoose');

const recipeSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: { 
        type: String, 
        required: true 
    },
    image: { 
        type: String, 
        required: false 
    },
    instructions: { 
        type: String, 
        required: true 
    },
    cookingMinutes: { 
        type: Number, 
        required: false 
    },
    preparationMinutes: { 
        type: Number, 
        required: false 
    },
    cheap: { 
        type: Boolean, 
        required: true 
    },
    veryPopular: { 
        type: Boolean, 
        required: true 
    },
    lowFodmap: {
        type: Boolean, 
        required: true 
    },
    veryHealthy: {
        type: Boolean, 
        required: true 
    },
    glutenFree: {
        type: Boolean, 
        required: true 
    },
    vegan: {
        type: Boolean, 
        required: true 
    },
    vegetarian: {
        type: Boolean, 
        required: true 
    },
    ketogenic: {
        type: Boolean, 
        required: true 
    },
    sustainable: {
        type: Boolean, 
        required: true 
    },
    dairyFree: {
        type: Boolean, 
        required: true 
    },
    whole30: {
        type: Boolean, 
        required: true 
    },
    ingredients: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Ingredient'
    }],
});

module.exports = mongoose.model('Recipe', recipeSchema);