const Ingredient = require('../models/ingredient');
const fs = require('fs')
const { StaticPool } = require("node-worker-threads-pool");
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

exports.getSimilarIngredients = (req, res, next) => {
    let selectedFilters = req.body.selectedFilters 
    let ignoredRecipes = req.body.ignoredRecipes 
    let selectedIngredients = req.body.ingredients
    let selectedMainIngredient = req.body.mainIngredient

    let rawdata = fs.readFileSync('allIngredients.json');  
    let ingredients = JSON.parse(rawdata).sort((a,b) => a["name"]>b["name"])

    let result = { mainIngredientIds: [], ingredientsIds: []}

    const getSimilarIngredientsPool = new StaticPool({
        size: selectedIngredients.length + 1,
        task: './api/workers/ingredient-similarity.js'
    });

    let promises = !selectedMainIngredient ? []
    : [getSimilarIngredientsPool.exec({
        ingredients,
        selectedFilters,
        ignoredRecipes,
        ingredient: selectedMainIngredient,
        isMainIngredient: true
    })]

    selectedIngredients.forEach( async ingredient => {
        promises.push(getSimilarIngredientsPool.exec({
            ingredients,
            selectedFilters,
            ignoredRecipes,
            ingredient,
            isMainIngredient: false
        }))
    })

    Promise.all(promises).then(values => {
        for(let i = 0; i<promises.length; i++) {
            if(selectedMainIngredient && i === 0) {
                result.mainIngredientIds = values[0]
            }else {
                result.ingredientsIds.push(values[i])
            }
        }

        res.status ? res.status(200).json({ result }) : null;
    });
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
        recipeId: req.body.recipeId
    })

    ingredient.save()
        .then(result => {
            if(result){
                res.status(200).json(result);
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
