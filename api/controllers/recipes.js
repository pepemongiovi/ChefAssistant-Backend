const mongoose = require('mongoose');
const Recipe = require('../model/recipe');
const unirest = require('unirest');
const ic = require('../controllers/ingredients')
const fs = require('fs')

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
            amount: i.amount,
            unit: i.unit,
            originalString: i.originalString,
            recipeId: recipeId
        }
        savedIngredients.push(req.body._id);
        ic.createIngredient(req);
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
    const ingredientsId = req.body.ids;
    const mainIngredient = ic.getSimilarIngredients({ params: { name: req.body.mainIngredient }}, {})
                            .filter((obj, i) => i<50)
    console.log(mainIngredient)
    ingredientsId.push(mainIngredient)

    let recipes = {}

    ingredientsId.forEach(ids => {
        ids.forEach(ingredient => {
            let id = ingredient.recipeId
            if(recipes[id] && recipes[id].matchedIngredients.filter(n => n == ingredient.name).length==0) {
                recipes[id].matchedIngredients.push(ingredient.name);
            }
            else if(!recipes[id]){
                recipes[id] = {
                    recipeId: id,
                    matchedIngredients: [ingredient.name], 
                    totalRecipeIngredientsCount: ingredient.totalRecipeIngredientsCount
                }
            }
        })
    })
  
    recipes = Object.keys(recipes).map(key => recipes[key])
                .sort((r1, r2) => (r2.matchedIngredients.length - r1.matchedIngredients.length))
                .filter((recipe, index) => index<200)
                .sort((r1, r2) => {
                    return (r2.matchedIngredients.length/r2.totalRecipeIngredientsCount
                        - r1.matchedIngredients.length/r1.totalRecipeIngredientsCount)
                })
    
    recipesWithMainIngredient = recipes.filter(recipe => mainIngredient.filter(i => i.recipeId == recipe.recipeId).length > 0)
    otherRecipes = recipes.filter(recipe => mainIngredient.filter(i => i.recipeId == recipe.recipeId).length == 0)
    //console.log(recipesWithMainIngredient)
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
        title: req.body.title,
        ingredients: addIngredients(req.body.extendedIngredients, id),
        image: req.body.image,
        instructions: req.body.instructions,
        cookingMinutes: req.body.cookingMinutes,
        preparationMinutes : req.body.preparationMinutes,
        cheap: req.body.cheap, 
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
            recipes.ingredients.forEach(r => {
                ic.deleteIngredient({ params: {id: r}})
            })
            console.log(err);
            res.status(500).json({ error: err })
        }); 
};

const createdRecipee = (req, res, next) => {
    
    const recipe = new Recipe({
        _id: new mongoose.Types.ObjectId,
        title: req.body.title,
        ingredients: [],
        image: req.body.image,
        instructions: req.body.instructions,
        cookingMinutes: req.body.cookingMinutes,
        preparationMinutes : req.body.preparationMinutes,
        cheap: req.body.cheap, 
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
                addIngredients(req.body.extendedIngredients, result._id);
                // res.status(200).json({
                //     message: 'Handling POST request to /recipes',
                //     createdRecipe: recipe
                // });
            }
            else {
                res.status(404).json({ message: 'No valid entry found.' })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err })
        }); 
};
