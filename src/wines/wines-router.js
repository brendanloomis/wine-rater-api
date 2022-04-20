const path = require('path');
const express = require('express');
const logger = require('../logger');
const WinesService = require('./wines-service');
const xss = require('xss');

const winesRouter = express.Router();
const jsonParser = express.json();

// serializes wine info to protect from xss attacks
const serializeWine = wine => ({
    wine_id: wine.wine_id,
    wine_name: xss(wine.wine_name),
    winery: xss(wine.winery),
    varietal: xss(wine.varietal),
    vintage: xss(wine.vintage),
    rating: xss(wine.rating),
    notes: xss(wine.notes),
    user_id: wine.user_id
});

winesRouter
    .route('/')
    .get((req, res, next) => {
        // get user id from the query
        const { userId } = req.query;

        // return an error if there is no userId
        if (!userId) {
            logger.error(`userId query is required`);
            return res.status(400).json({
                error: {
                    message: `Query must contain 'userId'`
                }
            });
        }

        // return the wines based on the user id
        WinesService.getWines(
            req.app.get('db'),
            userId
        )
            .then(wines => {
                res.json(wines.map(serializeWine));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { wine_name, winery, varietal, vintage, rating, notes, user_id } = req.body;
        const newWine = { wine_name, winery, varietal, vintage, rating, notes, user_id };
        const newWineRequired = { wine_name, winery, varietal, rating, user_id };

        // return an error if the required fields aren't in the request body
        for (const [key, value] of Object.entries(newWineRequired)) {
            if (value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        WinesService.insertWine(
            req.app.get('db'),
            newWine
        )
            .then(wine => {
                logger.info(`Project with id ${wine.wine_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${wine.wine_id}`))
                    .json(serializeWine(wine));
            })
            .catch(next);
    });

winesRouter
    .route('/:wine_id')
    .all((req, res, next) => {
        const { wine_id } = req.params;

        WinesService.getById(
            req.app.get('db'),
            wine_id
        )
            .then(wine => {
                // return a 404 error if the wine doesn't exist
                if (!wine) {
                    logger.error(`Wine with id ${wine_id} not found`);
                    return res.status(404).json({
                        error: { message: `Wine doesn't exist` }
                    });
                }
                res.wine = wine;
                next();
            })
            .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeWine(res.wine));
    })
    .delete((req, res, next) => {
        const { wine_id } = req.params;

        WinesService.deleteWine(
            req.app.get('db'),
            wine_id
        )
            .then(() => {
                logger.info(`Wine with id ${wine_id} deleted`);
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { wine_name, winery, varietal, vintage, rating, notes } = req.body;
        const wineToUpdate = { wine_name, winery, varietal, vintage, rating, notes };
        const { wine_id } = req.params;

        // return an error if the body doesn't contain any fields
        const numberOfValues = Object.values(wineToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res.status(400).json({
                error: { message: `Request body must contain at least one of 'wine_name', 'winery', 'varietal', 'vintage', 'rating', or 'notes'`}
            });
        }

        WinesService.updateWine(
            req.app.get('db'),
            wine_id,
            wineToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = winesRouter;