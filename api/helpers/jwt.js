const expressJwt = require('express-jwt');
const config = require('../../config.json');
const db = require('../helpers/db');
const User = db.User;

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            /^\/users\/authenticate/,
            /^\/users\/register/,
            /^\/ingredients\/similarIngredients/,
            /^\/ingredients\/.*/,
            /^\/recipes\/.*/,
            /^\/recipes\/recommendedRecipes/, 
        ]
    });
}

async function isRevoked(req, payload, done) {
    const user = await User.findById(payload.sub);

    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    done();
};