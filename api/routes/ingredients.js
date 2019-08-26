const express = require('express');
const router = express.Router();
const IngredientController = require('../controllers/ingredients');

router.get('/', IngredientController.getIngredients);

router.get('/:id', IngredientController.getIngredient);

router.post('/similarIngredients', IngredientController.getSimilarIngredients);

router.post('/', IngredientController.createIngredient);

router.delete('/:id', IngredientController.deleteIngredient);

router.patch('/:id', IngredientController.updateIngredient)

module.exports = router;