const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/recipes');

router.get('/', RecipeController.getRecipes);

router.get('/:id', RecipeController.getRecipe);

router.post('/recommendedRecipes', RecipeController.getRecommendedRecipes);

router.patch('/:id', RecipeController.updateRecipe);

router.delete('/:id', RecipeController.deleteRecipe);

router.post('/', RecipeController.createRecipe);

module.exports = router;