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
        return Promise.reject('Connection error: ' + error.message);
    });
};

// const returnPromises = object => {
//     let length = object.length,
//         array = [],
//         promise = new Promise( (resolve, reject) => {
//             object.forEach( index => {
//                 index.then( value => {
//                     array.push(value[0]);
//                     if (array.length == length) {
//                         resolve(array);
//                     }
//                 })
//             })
//     });
//     return promise;
// }

var drawPokemon = function drawPokemon(pokemonData) {
    var promise = new Promise(function (resolve, reject) {
        var name = pokemonData.name,
            id = pokemonData.id,
            image = pokemonData.sprites.front_default,
            types = pokemonData.types,
            stats = pokemonData.stats,
            abilities = pokemonData.abilities,
            height = pokemonData.height,
            weight = pokemonData.weight;

        // let lang_types = types.map( index => {
        //    return getData(index.type.name, "type")
        //         .then( type => {
        //             return type.names.filter(value => {
        //                 return value.language.name == "es"
        //             })
        //         })
        // })

        getData(name, 'pokedex').then(function (entry) {
            var habitat = entry.habitat,
                egg_groups = entry.egg_groups,
                flavor_text_entries = entry.flavor_text_entries;


            var get_habitat = habitat == null ? 'none' : habitat.name;

            var flavorText = false;
            flavor_text_entries.map(function (index) {
                if (index.language.name == "en" && flavorText == false) {
                    flavorText = index.flavor_text;
                }
            });

            var results = idSelector('results');
            results.innerHTML = '\n                    <div class="row">\n                        <div class="col-xs-8">\n                            <div class="row">\n                                <div class="col-xs-4">\n                                    <img class="img-responsive center-block" src="' + image + '" />\n                                </div>\n                                <div class="col-xs-8">\n                                    <p>N\xB0 ' + id + ' - ' + capitalizeFirst(name) + '</p>\n                                    <p>Type: ' + types.reverse().map(function (value) {
                return capitalizeFirst(value.type.name);
            }).toLocaleString().replace(',', ' - ') + '</p>\n                                    <p>Abilities: ' + abilities.reverse().map(function (value) {
                return (value.is_hidden ? '(HA) ' : '') + capitalizeFirst(value.ability.name);
            }).toLocaleString().replace(',', ' - ') + '</p>\n                                </div>\n                            </div>\n                            <div class="row">\n                                <div class="col-xs-6">\n                                    <p>Weight: ' + decimalFormat(weight) + ' kg</p>\n                                </div>\n                                <div class="col-xs-6">\n                                    <p>Height: ' + decimalFormat(height) + ' m</p>\n                                </div>\n                            </div>\n                            <div class="row">\n                                <div class="col-xs-6">\n                                    <p>Egg groups: ' + egg_groups.reverse().map(function (value) {
                return lastIsNumber(capitalizeFirst(value.name));
            }).toLocaleString().replace(',', ' - ') + '</p>\n                                </div>\n                                <div class="col-xs-6">\n                                    <p>Habitat: ' + capitalizeFirst(get_habitat) + '</p>\n                                </div>\n                            </div>\n                            <div class="row">\n                                <div class="col-xs-12">\n                                    <p>' + flavorText + '</p>\n                                </div>\n                            </div>\n                        </div>\n                        <div class="col-xs-4">\n                            ' + stats.reverse().map(function (value) {

                return '\n                                    <span class="tiny">' + value.stat.name.toUpperCase() + ' </span>\n                                    <div class="progress">\n                                        <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" style="width: ' + roundStat(value.base_stat) + '%">\n                                            ' + value.base_stat + '\n                                        </div>\n                                    </div>';
            }).toLocaleString().replace(/(,)/g, '') + '\n                        </div>\n                    </div>\n                ';
            resolve(true);
        }).catch(function (error) {
            reject(error + ' on "' + name + ' - Pokedex"');
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
            }).catch(function (error) {
                toggleSearchState(toSearch);
                alert(error);
            });
        }).catch(function (error) {
            toggleSearchState(toSearch);
            alert(error + ' on "' + value + ' - Pokemon"');
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

function roundStat(num) {
    return Math.ceil(num * 100 / 190);
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lastIsNumber(string) {
    return isNaN(string.slice(-1)) ? string : string.slice(0, string.length - 1) + ' ' + string.slice(-1);
}

function decimalFormat(num) {
    num = num.toString();
    return num.length == 1 ? num : num.substring(0, num.length - 1) + "." + num.substr(-1);
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