const mongoose = require('mongoose');
const Ingredient = require('../model/ingredient');
const RecipeController = require('../controllers/recipes');
const fs = require('fs');

exports.getIngredients = (req, res, next) => {
    Ingredient.find()
        .select('name recipeId')
        .exec()
        .then(res.status(200).json(result))
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err })
        })
};


exports.getSimilarIngredients = (req, res, next) => {
    const userInput = req.params.name;

    let rawdata = fs.readFileSync('ingredients.json');  
    let ingredients = JSON.parse(rawdata); 
    let ingredientsSimilarity = [];

    ingredients.forEach(ingredient => {
        let iSize = userInput.length + 1;
        let jSize = ingredient.name.length + 1;
        let matrix = Array(iSize).fill().map(() => Array(jSize).fill(0));
        
        for(let i = 0; i<iSize; i++) {
            matrix[i][0] = i;
        }

        for(let i = 0; i<jSize; i++) {
            matrix[0][i] = i;
        }

        for(let i = 1; i<iSize; i++) {
            for(let j = 1; j<jSize; j++) {
                matrix[i][j] = Math.min(
                                matrix[i-1][j-1] + (userInput[i-1] == ingredient.name[j-1] ? 0 : 13), //substitute char cost
                                matrix[i-1][j] + 7, //delete char cost
                                matrix[i][j-1] + 4) //add char cost
            }
        }

        let minimumEditDistance = matrix[iSize-1][jSize-1];
        ingredientsSimilarity.push({
            name: ingredient.name, 
            distance: minimumEditDistance, 
            recipeId: ingredient.recipeId,
            totalRecipeIngredientsCount: ingredient.ingredientsPaired
        });
    })

    ingredientsSimilarity.sort((a, b) => (a.distance > b.distance) ? 1 : -1)

    res.status(200).json({ 
        result: ingredientsSimilarity.filter((obj, index) => index<1000)
    });
};

exports.getIngredient = (req, res, next) => {
    const id = req.params.id;

    Ingredient.find({ _id: id })
        .select('_id name amount unit label')
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

exports.createIngredient = (req, res, next) => {
    // const ingredients = ['tomatoes', 'cheese', 'chicken', 'olive oil', 'bread', 'pasta'];
    // const fs = require('fs');

    // let rawdata = fs.readFileSync('finalRecipes.json');  
    // let recipes = JSON.parse(rawdata); 
    // let recipeRank = [];
    // let a = 0;
    // //res.status(200).json({'name': recipes[0].extendedIngredients[0].name});
    // for(let i = 0; i < recipes.length; i++) {
    //     let matches = 0;
    //     for(let j = 0; j < ingredients.length; j++){
    //         for (let w = 0; w < recipes[i].extendedIngredients.length; w++) {
    //             if(recipes[i].extendedIngredients[w].name == ingredients[j]) {
    //                 matches += 1;
    //             }
    //         }
    //     }
    //     recipeRank.push({matches: matches/recipes[i].extendedIngredients.length, recipe: recipes[i]})
    // }

    // recipeRank.sort((a, b) => (a.matches < b.matches) ? 1 : -1)

    // result = [];

    // for (let i = 0; i < 20; i++){
    //     result.push(recipeRank[i]);
    // }
    // res.status(200).json(result);

    const ingredient = new Ingredient({
        _id: req.body._id,
        name: req.body.name,
        amount: req.body.amount,
        unit: req.body.unit,
        label: req.body.originalString,
        recipeId: req.body.recipeId
    })

    ingredient.save()
        .then(result => {
            if(result){
                //res.status(200).json(result);
            } 
            else res.status(404);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err })
        }); 
};

exports.deleteIngredient = (req, res, next) => {
    const id = req.params.id;

    Ingredient.remove({ _id: id })
        .exec()
        .then(result => {
            if(result) res.status(200).json(result);
            else res.status(404);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err })
        }); 
};

exports.updateIngredient = (req, res, next) => {
    const id = req.params.id;
    const updatedIngredient = {};

    Object.keys(req.body).forEach(att => {
        updatedIngredient[att] = req.body[att];
    });

    Ingredient.update( { _id: id }, { $set: updatedIngredient })
        .exec()
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => {
            console.log(err);
            res.status(404).json({
                error: err
            })
        })
};
