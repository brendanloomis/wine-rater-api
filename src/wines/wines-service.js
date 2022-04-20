const WinesService = {
    getWines(knex, user_id) {
        return knex
            .select('*')
            .from('wines')
            .where('user_id', user_id)
    },

    insertWine(knex, newWine) {
        return knex
            .insert(newWine)
            .into('wines')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, wine_id) {
        return knex
            .from('wines')
            .select('*')
            .where('wine_id', wine_id)
            .first();
    },

    deleteWine(knex, wine_id) {
        return knex('wines')
            .where({ wine_id })
            .delete();
    },

    updateWine(knex, wine_id, newWineFields) {
        return knex('wines')
            .where({ wine_id })
            .update(newWineFields);
    }
};

module.exports = WinesService;