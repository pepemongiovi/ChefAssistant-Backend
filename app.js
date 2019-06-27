const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');

const recipeRoutes = require('./api/routes/recipes');
const ingredientsRoutes = require('./api/routes/ingredients');

mongoose.connect(
    `mongodb+srv://giuseppemongiovi:${process.env.MONGODB_ATLAS_PW}@cluster0-obkuk.mongodb.net/test?retryWrites=true`,
    { useNewUrlParser: true }
);

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false, limit: '50mb'}));
app.use(express.json({limit: '50mb'}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if(req.method === 'OPTIONS') {
        res.header(
            'Access-Control-Allow-Methods', 
            'PUT, POST, GET, DELETE, PATCH'
        );
        return res.status(200).json({});
    }
    next();
})

app.use('/recipes', recipeRoutes);
app.use('/ingredients', ingredientsRoutes);

app.use((req, res, next) => {
   const error = new Error('Not found!');
   error.status = 404;
   next(error);
});

app.use((error, req, res, next) => {
   res.status(error.status || 500);
   res.json({
      error: {
         message: error.message
      }
   })
});

module.exports = app;