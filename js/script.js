'use strict';

var baseURL = 'https://pokeapi.co/api/v2/';
var pokemonURL = function pokemonURL(identifier) {
    return baseURL + 'pokemon/' + identifier + '/';
};

var getData = function getData(param, toGet) {
    switch (toGet) {
        case 'pokemon':
            param = pokemonURL(param);
            break;
        default:
            // statements_def
            break;
    }
    var cacheKey = param;
    var cached = getFromCache(cacheKey);
    if (cached) {
        return Promise.resolve(cached);
    }
    return fetch(param).then(function (response) {
        if (response.ok && response.status == 200) {
            var contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/json')) {
                response.clone().text().then(function (content) {
                    localStorage.setItem(cacheKey, content);
                });
                return response.json().catch(function (error) {
                    return Promise.reject('Invalid JSON: ' + error.message);
                });
            } else {
                return Promise.reject('Invalid content type: ' + contentType);
            }
        } else if (response.status == 400) {
            return Promise.reject('Page not found: ' + url);
        } else {
            return Promise.reject('HTTP error: ' + response.status);
        }
    }).catch(function (error) {
        return Promise.reject(error.message);
    });
};

var drawPokemon = function drawPokemon(pokemonData) {
    var name = pokemonData.name,
        id = pokemonData.id,
        image = pokemonData.sprites.front_default,
        types = pokemonData.types;


    var results = idSelector('results');
    results.innerHTML = '\n      <p>N\xB0 ' + id + '</p>\n      <p>' + name + '</p>\n      <p>' + types.map(function (index) {
        return index.type.name;
    }).toLocaleString().replace(',', ' - ') + '</p>\n      <img src="' + image + '" />\n  ';
};

idSelector("main-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var toSearch = idSelector("search-pkmn");
    var value = toSearch.value.toLowerCase();
    if (value.length > 0) {
        toSearch.style.background = '#FFF';
        toggleSearchState(toSearch);
        getData(value, 'pokemon').then(function (data) {
            toggleSearchState(toSearch);
            drawPokemon(data);
            $('#resultsmodal').modal('show');
        });
    } else {
        toSearch.style.background = '#FFFFCC';
        toSearch.focus();
    }
});

function idSelector(id) {
    return document.querySelector('#' + id);
}

function toggleSearchState(param) {
    var button = param.nextElementSibling;
    if (param.disabled) {
        button.querySelector('#loading').classList.add('hidden');
        button.querySelector('#go').classList.remove('hidden');
        param.disabled = false;
        button.disabled = false;
        param.value = '';
    } else {
        button.querySelector('#go').classList.add('hidden');
        button.querySelector('#loading').classList.remove('hidden');
        param.disabled = true;
        button.disabled = true;
    }
}

// SIN USO
function setInCache(id, data) {
    localStorage.setItem(id, JSON.stringify(data));
}

function getFromCache(id) {
    return localStorage.getItem(id) ? JSON.parse(localStorage.getItem(id)) : false;
}

function display(param) {
    console.log(param);
}

//# sourceMappingURL=script.js.map