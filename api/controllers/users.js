const config = require('../../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../helpers/db');
const User = db.User;

exports.authenticate = (req, res, next) => {
    const { username, password } = req.body

    User.findOne({ username }).then(user => {
        if(!user) {
            res.status(404).json({ message: 'User not found' })
        }
        else {
            bcrypt.compare(password, user.hash).then(pwdIsCorrect => {
                if (user && pwdIsCorrect) {
                    const { hash, ...userWithoutHash } = user.toObject();
                    const token = jwt.sign({ sub: user.id }, config.secret);
                    res.json({
                        ...userWithoutHash,
                        token
                    });
                }
                else {
                    res.status(400).json({ message: 'Incorrect password' })
                }
            }).catch(err => next(err))
        }
    }).catch(err => next(err))
}

exports.register = (req, res, next) => {
    const { username, password } = req.body
    
    User.findOne({ username: username }).then(user =>{
        if(user) {
            res.status(409).json({ message: 'Username "' + username + '" is already taken' })
        }
        else {
            const user = new User(req.body);
            user.hash = bcrypt.hashSync(password, 10);
            user.save().then(() => {
                res.json({ message: "User successfully created!"})
            }).catch(err => next(err))
            
        }
    }).catch(err => next(err))
}

exports.getAll = (req, res, next) => {
    User.find()
        .select('-hash')
        .then(users => res.json(users))
        .catch(err => next(err));
}

exports.getById = (req, res, next) => {
    User.findById(req.params.id)
        .select('-hash')
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

exports.update = (req, res, next) => {
    const { username, password, favoriteRecipes } = req.body
    User.findById(req.params.id).then(user => {
        if (!user) {
            res.status(404).json({ message: 'User not found'})
        }
        else {
            if (user.username !== username) {
                User.findOne({ username: username }).then(ownerOfUsername => {
                    if(ownerOfUsername) {
                       res.status(409).json({ 
                           messsage: 'Username "' + username + '" is already taken'
                       })
                   }
               }).catch(err => next(err));
            }
            else {
                if(password) {
                    user.hash = bcrypt.hashSync(password, 10)
                }
                user.favoriteRecipes = favoriteRecipes
                user.save().then(() => {
                    res.status(200).json({ message: "User successfully updated" })
                }).catch(err => next(err));
            }
        }
    }).catch(err => next(err));
}

exports.delete = (req, res, next) => {
    User.findByIdAndRemove(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}