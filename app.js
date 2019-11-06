const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const recipesRoutes = require('./api/routes/recipes');
const ingredientsRoutes = require('./api/routes/ingredients');
const usersRoutes = require('./api/routes/users');

const jwt = require('./api/helpers/jwt');
const errorHandler = require('./api/helpers/error-handler');

mongoose.connect(
    `mongodb+srv://giuseppemongiovi:${process.env.MONGODB_ATLAS_PW}@cluster0-obkuk.mongodb.net/test?retryWrites=true`,
    { useNewUrlParser: true }
);

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false, limit: '50mb'}));
app.use(express.json({limit: '50mb'}));
app.use(cors());
app.use(jwt());

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

app.use('/users', usersRoutes);
app.use('/recipes', recipesRoutes);
app.use('/ingredients', ingredientsRoutes);

app.use(errorHandler);

module.exports = app;