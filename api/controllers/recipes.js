const mongoose = require('mongoose');
const Recipe = require('../models/recipe');
const IngredientsController = require('../controllers/ingredients')

exports.getRecipes = (req, res, next) => {    
    Recipe.find()
        .exec()
        .then(result => res.status(200).json(result))
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err })
        })
};

const addIngredients = (ingredients, recipeId) => {
    let savedIngredients = [];

    ingredients.forEach(i => {
        let req = {};
        req.body = {
            _id: new mongoose.Types.ObjectId,
            name: i.name,
            originalString: i.originalString,
            recipeId: recipeId
        }
        savedIngredients.push(req.body._id);
        IngredientsController.createIngredient(req);
    })
   
    return savedIngredients;
}

exports.updateRecipe = (req, res, next) => {
    const id = req.params.id;
    const updatedRecipe = {};

    Object.keys(req.body).forEach(att => {
        updatedRecipe[att] = req.body[att];
    });

    Recipe.update( { _id: id }, { $set: updatedRecipe })
        .exec()
        .then(result => res.status(200).json(result))
        .catch(err => {
            console.log(err);
            res.status(404).json({ error: err })
        })
};

exports.getRecommendedRecipes = (req, res, next) => {
    const ingredientsId = req.body.ingredientsIds;
    const mainIngredientIds = req.body.mainIngredientIds

    ingredientsId.push(mainIngredientIds)
    
    let recipes = {}

    //Finds intersection between similar ingredient's recipeId
    ingredientsId.forEach(ids => {
        const recipesWithMatchedIngredient = []
        ids.forEach(ingredient => {
            const id = ingredient.recipeId

            if(!recipesWithMatchedIngredient.find(_id => _id === id)) {
                recipesWithMatchedIngredient.push(id)

                if(recipes[id] && recipes[id].matchedIngredients.filter(n => n == ingredient.name).length==0) {
                    recipes[id].matchedIngredients.push(ingredient.name);
                }
                else if(!recipes[id]){
                    recipes[id] = {
                        recipeId: id,
                        matchedIngredients: [ingredient.name]
                    }
                }
            } 
        })
    })

    recipes = Object.keys(recipes).map(key => recipes[key])
                .sort((r1, r2) => (r2.matchedIngredients.length - r1.matchedIngredients.length))
                .filter((e, i) => i<400)

    recipesWithMainIngredient = recipes.filter(recipe => 
            mainIngredientIds.filter(i => i.recipeId == recipe.recipeId).length > 0)

    otherRecipes = recipes.filter(recipe => 
            mainIngredientIds.filter(i => i.recipeId == recipe.recipeId).length == 0)

    recipes = recipesWithMainIngredient.concat(otherRecipes)
    
    res.status(200).json({ recipes: recipes.filter((obj, i) => i < 20) })
}

exports.getRecipe = (req, res, next) => {
    const id = req.params.id;

    Recipe.find({ _id: id })
        .exec()
        .then(result => {
            if(result) res.status(200).json(result);
            else res.status(404);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err })
        })
};

exports.deleteRecipe = (req, res, next) => {
    const id = req.params.id;
    
    Recipe.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err })
        }); 
};

exports.createRecipe = (req, res, next) => {    
    let id = new mongoose.Types.ObjectId;

    const recipe = new Recipe({
        _id: id,
        title: req.body.name,
        ingredients: addIngredients(req.body.ingredients, id),
        image: req.body.image,
        instructions: req.body.instructions,
        cookingMinutes: req.body.cookingMinutes,
        preparationMinutes : req.body.preparationMinutes,
        veryPopular: req.body.veryPopular, 
        lowFodmap: req.body.lowFodmap,
        veryHealthy: req.body.veryHealthy,
        glutenFree: req.body.glutenFree,
        vegan: req.body.vegan,
        vegetarian: req.body.vegetarian,
        ketogenic: req.body.ketogenic,
        sustainable: req.body.sustainable,
        dairyFree: req.body.dairyFree,
        whole30: req.body.whole30
    });
    
    recipe.save()
        .then( result => {
            if(result) {
                res.status(200).json({
                    message: 'Handling POST request to /recipes',
                    createdRecipe: recipe
                });
            }
            else {
                res.status(404).json({ message: 'No valid entry found.' })
            }
        })
        .catch(err => {
            console.log(err)
            recipe.ingredients.forEach(r => {
                IngredientsController.deleteIngredient({ params: {id: r}})
            })
            console.log(err);
            res.status(500).json({ error: err })
        }); 
};