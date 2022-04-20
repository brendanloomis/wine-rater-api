const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const UsersService = require('./users-service');

const usersRouter = express.Router();
const jsonParser = express.json();

// serializes user info to protect against xss attacks
const serializeUser = user => ({
    user_id: user.user_id,
    first_name: xss(user.first_name),
    last_name: xss(user.last_name),
    username: xss(user.username)
});

// serializes username to protect against xss attacks
const serializeUsername = user => ({
    username: xss(user.username)
});

usersRouter
    .route('/')
    .post(jsonParser, (req, res, next) => {
        const { first_name, last_name, username, password } = req.body;
        const newUser = { first_name, last_name, username, password };

        // returns an error if required fields aren't in the request body
        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        UsersService.insertUser(
            req.app.get('db'),
            newUser
        )
            .then(user => {
                logger.info(`User with id ${user.user_id} created.` );
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${user.user_id}`))
                    .json(serializeUser(user));
            })
            .catch(next);
    });

// Route for logging in a user
usersRouter
    .route('/login')
    .post(jsonParser, (req, res, next) => {
        const { username, password } = req.body;

        if(!username || !password) {
            logger.error(`'username' and 'password' are required`);
            return res.status(400).json({
                error: { message: `Request body must contain 'username' and 'password'`}
            });
        }

        UsersService.getUserByUsername(
            req.app.get('db'),
            username
        )
            .then(user => {
                // return an error if the user doesn't exist
                if(!user) {
                    logger.error(`User not found.`);
                    return res.status(404).json({
                        error: { message: `User doesn't exist` }
                    });
                }

                // return an error if the password isn't correct
                if(user.password !== password) {
                    logger.error(`Incorrect password`);
                    return res.status(401).json({
                        error: { message: `Incorrect password` }
                    });
                }

                // return the user's info
                return res.json(serializeUser(user));
            })
            .catch(next);
    });

// route to get all usernames in the users table
usersRouter
    .route('/usernames')
    .get((req, res, next) => {
        UsersService.getAllUsernames(
            req.app.get('db')
        )
            .then(usernames => {
                res.json(usernames.map(serializeUsername));
            })
            .catch(next);
    });

module.exports = usersRouter;