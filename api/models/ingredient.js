const mongoose =  require('mongoose');

const ingredientSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { 
        type: String, 
        required: true 
    },
    label: {
        type: String,
        required: true
    },
    recipeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe'
    },
})

module.exports = mongoose.model('Ingredient', ingredientSchema);