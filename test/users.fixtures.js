function makeUsersArray() {
    return [
        {
            user_id: 1,
            first_name: 'test',
            last_name: 'user',
            username: 'testUser',
            password: 'pass123'
        },
        {
            user_id: 2,
            first_name: 'another',
            last_name: 'test',
            username: 'testAccount',
            password: 'testing123'
        }
    ];
};

function makeUsernamesArray() {
    return [
        {
            username: 'testUser'
        },
        {
            username: 'testAccount'
        }
    ];
};

function makeMaliciousUser() {
    const maliciousUser = {
        user_id: 911,
        first_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        last_name: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        username: 'Naughty naughty very naughty <script>alert("xss");</script>',
        password: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    };

    const expectedUser = {
        ...maliciousUser,
        first_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        last_name: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        username: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
    };

    return {
        maliciousUser,
        expectedUser
    };
};

module.exports = {
    makeUsersArray,
    makeUsernamesArray,
    makeMaliciousUser
};