function makeWinesArray() {
    return [
        {
            wine_id: 1,
            wine_name: 'Test Wine',
            winery: 'Test Winery',
            varietal: 'Chardonnay',
            vintage: '2013',
            rating: '3',
            notes: 'Test test test',
            user_id: 1
        },
        {
            wine_id: 2,
            wine_name: 'Sample',
            winery: 'Wine',
            varietal: 'Sparkling',
            vintage: '2016',
            rating: '4',
            notes: 'Testing this',
            user_id: 1
        },
        {
            wine_id: 3,
            wine_name: 'Hello',
            winery: 'Love Wines',
            varietal: 'Cabernet Sauvignon',
            vintage: '2017',
            rating: '5',
            notes: 'Test notes',
            user_id: 2
        },
    ];
}

function makeMaliciousWine() {
    const maliciousWine  = {
        wine_id: 911,
        wine_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        winery: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        varietal: 'Naughty naughty very naughty <script>alert("xss");</script>',
        vintage: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 'Naughty naughty very naughty <script>alert("xss");</script>',
        notes: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        user_id: 1
    };

    const expectedWine = {
        ...maliciousWine,
        wine_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        winery: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        varietal: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        vintage: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        rating: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        notes: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    };

    return {
        maliciousWine,
        expectedWine
    }
};

module.exports = {
    makeWinesArray,
    makeMaliciousWine
};