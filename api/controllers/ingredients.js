const Ingredient = require('../models/ingredient');
const fs = require('fs')
const { StaticPool } = require("node-worker-threads-pool");
const { Worker } = require('worker_threads')
const Promise = require('promise')

exports.getIngredients = (req, res, next) => {
    Ingredient.find()
        .select('name recipeId')
        .exec()
        .then(result => {
            if(result) res.status(200).json(result);
            else res.status(404);
        })
        .catch(err => {
            res.status(500).json({ error: err })
        }) 
}

const levenshteinDistance = (str1, str2) => {
    const rows = str1.length + 1
    const cols = str2.length + 1
    const deleteCost = 8
    const insertCost = 5
    const substituteCost = 13

    let matrix = Array(rows).fill().map(() => Array(cols).fill(0));
        
    for(let row = 1; row<rows; row++) {
        matrix[row][0] = row * deleteCost;
    }

    for(let col = 0; col<cols; col++) {
        matrix[0][col] = col * insertCost;
    }

    for(let col = 1; col<cols; col++) {
        for(let row = 1; row<rows; row++) {
            matrix[row][col] = Math.min(
                            matrix[row-1][col-1] + (str1[row-1] == str2[col-1] ? 0 : substituteCost), //substitute char cost
                            matrix[row-1][col] + deleteCost, //delete char cost
                            matrix[row][col-1] + insertCost) //add char cost
        }
    }

    return matrix[rows-1][cols-1];
}

const processSimilarIngredients = (ingredients, selectedFilters, userInput) => {
    //Filters the ingredients by selected filters
    ingredients = ingredients.filter(ingredient => {
        let matchesFilters = true
        selectedFilters.forEach(filter => {
            if(!ingredient[filter]) {
                matchesFilters = false
            }
        })
        return matchesFilters
    }); 

    let ingredientsSimilarity = [];

    ingredients.forEach(ingredient => {
        let minimumEditDistance = 0

        if(ingredientsSimilarity.length == 0 || ingredientsSimilarity[ingredientsSimilarity.length-1].name != ingredient.name) {   
            minimumEditDistance = levenshteinDistance(userInput, ingredient.name) 
        }
        else {
            minimumEditDistance = ingredientsSimilarity[ingredientsSimilarity.length-1].distance
        }
        
        ingredientsSimilarity.push({
            name: ingredient.name, 
            distance: minimumEditDistance, 
            recipeId: ingredient.recipeId,
            totalRecipeIngredientsCount: ingredient.ingredientsPaired
        });
    })
  
    ingredientsSimilarity = ingredientsSimilarity.sort((a, b) => (a.distance > b.distance) ? 1 : -1)
                                .filter((obj, index) => index<3000)
                                .filter(ingredient => ingredient.distance < 25)

    return ingredientsSimilarity
}

const getSimilarIngredientsWorker = (ingredients, selectedFilters, ingredient) => {
    return new Promise((resolve, reject) => {
        new Worker('./api/workers/ingredient-similarity.js', 
            { workerData: { 
                ingredients: ingredients,
                selectedFilters: selectedFilters,
                ingredient: ingredient
              } 
            }
        );
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        })
    })
}

exports.getSimilarIngredients = (req, res, next) => {
    let selectedFilters = req.body.selectedFilters 
    let selectedIngredients = req.body.ingredients
    let selectedMainIngredient = req.body.mainIngredient

    let rawdata = fs.readFileSync('allIngredients.json');  
    let ingredients = JSON.parse(rawdata).sort((a,b) => a["name"]>b["name"])

    let result = { mainIngredientIds: null, ingredientsIds: []}

    const pool = new StaticPool({
        size: selectedIngredients.length + 1,
        task: './api/workers/ingredient-similarity.js'
    });

    let promises = [pool.exec({
        ingredients: ingredients,
        selectedFilters: selectedFilters,
        ingredient: selectedMainIngredient
    })]

    selectedIngredients.forEach( async ingredient => {
        promises.push(pool.exec({ingredients, selectedFilters, ingredient}))
    })

    Promise.all(promises).then(function(values) {
        result.mainIngredientIds = values[0]
        
        for(let i = 1; i<promises.length; i++) {
            result.ingredientsIds.push(values[i])
        }

        res.status ? res.status(200).json({ result }) : null;
    });

    // result.mainIngredientIds = processSimilarIngredients(ingredients, selectedFilters, selectedMainIngredient)

    // selectedIngredients.forEach( ingredient => {
    //     result.ingredientsIds.push(processSimilarIngredients(ingredients, selectedFilters, ingredient))
    //  })

    // res.status ? res.status(200).json({ result }) : null;

};

exports.getIngredient = (req, res, next) => {
    const id = req.params.id;

    Ingredient.find({ _id: id })
        .select('_id name label')
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
    const ingredient = new Ingredient({
        _id: req.body._id,
        name: req.body.name,
        label: req.body.originalString,
        ingredientsPaired: req.body.ingredientsPaired,
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
