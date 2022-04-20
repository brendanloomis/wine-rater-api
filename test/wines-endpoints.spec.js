const { faEnvelopeOpenText } = require('@fortawesome/free-solid-svg-icons');
const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeUsersArray } = require('./users.fixtures');
const { makeWinesArray, makeMaliciousWine } = require('./wines.fixtures');

describe(`Wines Endpoints`, () => {
    let db;

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        });
        app.set('db', db);
    });

    after(`disconnect from db`, () => db.destroy());

    before(`clean the table`, () => db.raw('TRUNCATE users, wines'));
    
    afterEach(`cleanup`, () => db.raw('TRUNCATE users, wines'));

    describe(`Unauthorized requests`, () => {
        const testUsers = makeUsersArray();
        const testWines = makeWinesArray();

        beforeEach(`insert wines`, () => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('wines')
                        .insert(testWines)
                });
        });

        it(`responds with 401 Unauthorized for GET /api/wines`, () => {
            return supertest(app)
                .get('/api/wines')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/wines`, () => {
            return supertest(app)
                .post('/api/wines')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/wines/:wine_id`, () => {
            const wine = testWines[0];
            return supertest(app)
                .get(`/api/wines/${wine.wine_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/wines/:wine_id`, () => {
            const wine = testWines[0];
            return supertest(app)
                .delete(`/api/wines/${wine.wine_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for PATCH /api/wines/:wine_id`, () => {
            const wine = testWines[0];
            return supertest(app)
                .patch(`/api/wines/${wine.wine_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/wines`, () => {
        context(`Given no wines`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/wines?userId=1')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            });
        });

        context(`Given there are wines in the database`, () => {
            const testUsers = makeUsersArray();
            const testWines = makeWinesArray();

            beforeEach('Insert wines', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('wines')
                            .insert(testWines);
                    });
            });

            it(`responds with 200 and all of the user's wines`, () => {
                const user = testUsers[0];
                const expectedWines = testWines.filter(wine => wine.user_id === user.user_id);
                return supertest(app)
                    .get(`/api/wines?userId=${user.user_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedWines);
            });
        });

        context(`Given an XSS attack wine`, () => {
            const { maliciousWine, expectedWine } = makeMaliciousWine();
            const testUsers = makeUsersArray();

            beforeEach(`insert malicious wine`, () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('wines')
                            .insert(maliciousWine);
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/wines?userId=${maliciousWine.user_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].wine_name).to.eql(expectedWine.wine_name);
                        expect(res.body[0].winery).to.eql(expectedWine.winery);
                        expect(res.body[0].varietal).to.eql(expectedWine.varietal);
                        expect(res.body[0].vintage).to.eql(expectedWine.vintage);
                        expect(res.body[0].rating).to.eql(expectedWine.rating);
                        expect(res.body[0].notes).to.eql(expectedWine.notes);
                    });
            });
        });
    });

    describe(`GET /api/wines/:wine_id`, () => {
        context(`Given no wines`, () => {
            it(`responds with 404 when wine doesn't exist`, () => {
                const wineId = 23948;
                return supertest(app)
                    .get(`/api/wines/${wineId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Wine doesn't exist` }
                    });
            });
        });

        context(`Given there are wines in the database`, () => {
            const testUsers = makeUsersArray();
            const testWines = makeWinesArray();

            beforeEach(`insert wines`, () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('wines')
                            .insert(testWines);
                    });
            });

            it(`responds with 200 and the specified wine`, () => {
                const wineId = 1;
                const expectedWine = testWines[wineId - 1];

                return supertest(app)
                    .get(`/api/wines/${wineId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedWine);
            });
        });

        context(`Given an XSS attack wine`, () => {
            const testUsers = makeUsersArray();
            const { maliciousWine, expectedWine } = makeMaliciousWine();

            beforeEach(`insert malicious wine`, () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('wines')
                            .insert(maliciousWine);
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/wines/${maliciousWine.wine_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.wine_name).to.eql(expectedWine.wine_name);
                        expect(res.body.winery).to.eql(expectedWine.winery);
                        expect(res.body.varietal).to.eql(expectedWine.varietal);
                        expect(res.body.vintage).to.eql(expectedWine.vintage);
                        expect(res.body.rating).to.eql(expectedWine.rating);
                        expect(res.body.notes).to.eql(expectedWine.notes);
                    });
            });
        });
    });

    describe(`DELETE /api/wines/:wine_id`, () => {
        context(`Given no wines`, () => {
            it(`responds with 404 when the wine doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/wines/2345`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Wine doesn't exist` }
                    });
            });
        });

        context(`Given there are wines in the database`, () => {
            const testUsers = makeUsersArray();
            const testWines = makeWinesArray();

            beforeEach(`insert wines`, () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('wines')
                            .insert(testWines);
                    });
            });

            it(`responds with 204 and removes the wine`, () => {
                const idToRemove = 2;
                const expectedWines = testWines.filter(w => w.wine_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/wines/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get('/api/wines?userId=1')
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedWines);
                    });
            });
        });
    });

    describe(`POST /api/wines`, () => {
        const testUsers = makeUsersArray();

        beforeEach(`insert users`, () => {
            return db
                .into('users')
                .insert(testUsers);
        });

        const requiredFields = ['wine_name', 'winery', 'varietal', 'rating'];

        requiredFields.forEach(field => {
            const newWine = {
                wine_name: 'New wine',
                winery: 'Test Winery',
                varietal: 'Chardonnay',
                rating: '4',
                user_id: 1
            };

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newWine[field];

                return supertest(app)
                    .post('/api/wines')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newWine)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        it(`creates a wine, responding with 201 and the new wine`, () => {
            const newWine = {
                wine_name: 'test wine',
                winery: 'new winery',
                varietal: 'chardonnay',
                vintage: '2014',
                rating: '4',
                notes: 'test notes',
                user_id: 1
            };

            return supertest(app)
                .post('/api/wines')
                .send(newWine)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.wine_name).to.eql(newWine.wine_name);
                    expect(res.body.winery).to.eql(newWine.winery);
                    expect(res.body.varietal).to.eql(newWine.varietal);
                    expect(res.body.vintage).to.eql(newWine.vintage);
                    expect(res.body.rating).to.eql(newWine.rating);
                    expect(res.body.notes).to.eql(newWine.notes);
                    expect(res.body).to.have.property('wine_id');
                    expect(res.headers.location).to.eql(`/api/wines/${res.body.wine_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/wines/${postRes.body.wine_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousWine, expectedWine } = makeMaliciousWine();

            return supertest(app)
                .post('/api/wines')
                .send(maliciousWine)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.wine_name).to.eql(expectedWine.wine_name);
                    expect(res.body.winery).to.eql(expectedWine.winery);
                    expect(res.body.varietal).to.eql(expectedWine.varietal);
                    expect(res.body.vintage).to.eql(expectedWine.vintage);
                    expect(res.body.rating).to.eql(expectedWine.rating);
                    expect(res.body.notes).to.eql(expectedWine.notes);
                });
        });
    });

    describe(`PATCH /api/wines/:wine_id`, () => {
        context(`Given no wines`, () => {
            it(`responds with 404 when wine doesn't exist`, () => {
                return supertest(app)
                    .patch(`/api/wines/2345`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Wine doesn't exist` }
                    });
            });
        });

        context(`Given there are wines`, () => {
            const testUsers = makeUsersArray();
            const testWines = makeWinesArray();

            beforeEach('insert wines', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('wines')
                            .insert(testWines);
                    });
            });

            it(`responds with 204 and updates the wine`, () => {
                const idToUpdate = 1;
                const updateWine = {
                    wine_name: 'update wine',
                    winery: 'update winery',
                    varietal: 'update varietal',
                    vintage: '2001',
                    rating: '1',
                    notes: 'update notes'
                };
                const expectedWine = {
                    ...testWines[idToUpdate - 1],
                    ...updateWine
                };

                return supertest(app)
                    .patch(`/api/wines/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateWine)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/wines/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedWine);
                    });
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 1;
                const updateWine = {
                    wine_name: 'updated wine'
                };
                const expectedWine = {
                    ...testWines[idToUpdate - 1],
                    ...updateWine
                };

                return supertest(app)
                    .patch(`/api/wines/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateWine,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/wines/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedWine)
                    );
            });
        });
    });
});