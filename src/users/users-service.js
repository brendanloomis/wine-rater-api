const UsersService = {
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('users')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getUserByUsername(knex, username) {
        return knex('users')
            .select('*')
            .where('username', username)
            .first();
    },

    getAllUsernames(knex) {
        return knex.select('username').from('users');
    }
};

module.exports = UsersService;