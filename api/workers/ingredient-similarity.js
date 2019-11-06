const { parentPort } = require('worker_threads')

const levenshteinDistance = (str1, str2) => {
    const rows = str1.length + 1
    const cols = str2.length + 1
    const substituteCost = 15
    const deleteCost = 5
    const insertCost = 5

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

const processSimilarIngredients = (ingredients, selectedFilters, ignoredRecipes, userInput, isMainIngredient) => {
    //Filters the ingredients by selected filters
    ingredients = ingredients.filter(ingredient => {
        let matchesFilters = true
        selectedFilters.forEach(filter => {
            if(!ingredient[filter]) {
                matchesFilters = false
            }
        })
        return matchesFilters
    }).filter(ingredient => 
        ignoredRecipes.filter( 
            id => ingredient.recipeId === id
        ).length === 0 
    ) 

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
            recipeId: ingredient.recipeId
        });
    })

    return ingredientsSimilarity.sort((a, b) => (a.distance > b.distance) ? 1 : -1)
                                .filter(ingredient => 
                                    ingredient.distance < (isMainIngredient ? 15 : 20)
                                )
                                .filter((obj, index) => index<3000)
                                
}

parentPort.on('message', (params) => {
    const result = processSimilarIngredients(
        params.ingredients,
        params.selectedFilters,
        params.ignoredRecipes,
        params.ingredient,
        params.isMainIngredient
    );
    
    parentPort.postMessage(result);
})




