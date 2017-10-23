'use strict';

var baseURL = 'https://pokeapi.co/api/v2/';
var pokemonURL = function pokemonURL(identifier) {
    return baseURL + 'pokemon/' + identifier + '/';
};
var pokedexEntry = function pokedexEntry(identifier) {
    return baseURL + 'pokemon-species/' + identifier + '/';
};
var typeDesc = function typeDesc(identifier) {
    return baseURL + 'type/' + identifier + '/';
};

var getData = function getData(param, toGet) {
    switch (toGet) {
        case 'pokemon':
            param = pokemonURL(param);
            break;
        case 'pokedex':
            param = pokedexEntry(param);
            break;
        case 'type':
            param = typeDesc(param);
            break;
        default:
            return Promise.reject("Invalid request.");
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

var returnPromises = function returnPromises(object) {
    var length = object.length,
        array = [],
        promise = new Promise(function (resolve, reject) {
        object.forEach(function (index) {
            index.then(function (value) {
                array.push(value[0]);
                if (array.length == length) {
                    resolve(array);
                }
            });
        });
    });
    return promise;
};

var drawPokemon = function drawPokemon(pokemonData) {
    var promise = new Promise(function (resolve, reject) {
        var name = pokemonData.name,
            id = pokemonData.id,
            image = pokemonData.sprites.front_default,
            types = pokemonData.types;


        var lang_types = types.map(function (index) {
            return getData(index.type.name, "type").then(function (type) {
                return type.names.filter(function (value) {
                    return value.language.name == "es";
                });
            });
        });

        returnPromises(lang_types).then(function (tipos) {
            setTimeout(function () {
                var results = idSelector('results');
                results.innerHTML = '\n                    <div class = "row">\n                        <div class="col-sm-3">\n                            <img class="img-responsive" src="' + image + '" />\n                        </div>\n                        <div class="col-sm-3">\n                            <p>N\xB0 ' + id + '</p>\n                            <p>' + name + '</p>\n                            <p>Tipo: ' + tipos.map(function (type) {
                    return type.name;
                }).toLocaleString().replace(',', ' - ') + '</p>\n                        </div>\n                    </div>\n                ';
                resolve(true);
            }, 0);
        });
    });

    return promise;
};

idSelector("main-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var toSearch = idSelector("search-pkmn");
    var value = toSearch.value.toLowerCase();
    if (value.length > 0) {
        toSearch.style.background = '#FFF';
        toggleSearchState(toSearch);
        getData(value, 'pokemon').then(function (data) {
            drawPokemon(data).then(function () {
                toggleSearchState(toSearch);
                $('#main-results').modal('show');
            });
        }).catch(function (error) {
            toggleSearchState(toSearch);
            alert('Error de conexi\xF3n.');
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