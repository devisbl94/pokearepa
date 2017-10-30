'use strict';

// URLs
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

// PRINCIPAL
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
                    try {
                        localStorage.setItem(cacheKey, content);
                    } catch (e) {
                        display("cache has been cleaned");
                        localStorage.clear();
                        localStorage.setItem(cacheKey, content);
                    }
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

var drawPokemon = function drawPokemon(pokemonData) {
    var promise = new Promise(function (resolve, reject) {
        var name = pokemonData.species.name,
            id = pokemonData.id,
            image = pokemonData.sprites.front_default,
            types = pokemonData.types,
            stats = pokemonData.stats,
            abilities = pokemonData.abilities,
            height = pokemonData.height,
            weight = pokemonData.weight;


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
            results.innerHTML = '\n                    <div class="row">\n                        <div class="col-xs-12 col-sm-8">\n                            <div class="row">\n                                <div class="col-xs-4">\n                                    <img class="img-responsive center-block" src="' + image + '" />\n                                </div>\n                                <div class="col-xs-8">\n                                    <p><b>N\xB0 ' + id + ' - ' + capitalizeFirst(name) + '</b></p>\n                                    <p><b>Type:</b><br> ' + types.reverse().map(function (value) {
                return capitalizeFirst(value.type.name);
            }).toLocaleString().replace(',', ' - ') + '</p>\n                                    <p><b>Abilities:</b><br> ' + abilities.reverse().map(function (value) {
                return (value.is_hidden ? ' (HA) ' : '') + capitalizeFirst(value.ability.name);
            }).toLocaleString().replace(',', ' - ') + '</p>\n                                </div>\n                            </div>\n                            <div class="row">\n                                <div class="col-xs-6">\n                                    <p><b>Weight:</b><br> ' + decimalFormat(weight) + ' kg</p>\n                                </div>\n                                <div class="col-xs-6">\n                                    <p><b>Height:</b><br> ' + decimalFormat(height) + ' m</p>\n                                </div>\n                            </div>\n                            <div class="row">\n                                <div class="col-xs-6">\n                                    <p><b>Egg groups:</b><br> ' + egg_groups.reverse().map(function (value) {
                return lastIsNumber(capitalizeFirst(value.name));
            }).toLocaleString().replace(',', ' - ') + '</p>\n                                </div>\n                                <div class="col-xs-6">\n                                    <p><b>Habitat:</b><br> ' + capitalizeFirst(get_habitat) + '</p>\n                                </div>\n                            </div>\n                            <div class="row">\n                                <div class="col-xs-12">\n                                    <p>' + flavorText + '</p>\n                                </div>\n                            </div>\n                        </div>\n                        <div class="col-sm-4 hidden-xs">\n                            ' + stats.reverse().map(function (value) {

                return '\n                                    <span class="tiny">' + value.stat.name.toUpperCase() + ' </span>\n                                    <div class="progress">\n                                        <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" style="width: ' + roundStat(value.base_stat) + '%">\n                                            ' + value.base_stat + '\n                                        </div>\n                                    </div>';
            }).toLocaleString().replace(/(,)/g, '') + '\n                        </div>\n                    </div>\n                ';
            $('#main-results').modal('show');
            resolve(true);
        }).catch(function (error) {
            reject(error + ' on "' + name + ' - Pokedex"');
        });
    });

    return promise;
};

// EVENTS
idSelector("main-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var toSearch = idSelector("search-pkmn");
    var mainForm = toSearch.parentElement.children;
    var value = toSearch.value.toLowerCase();
    if (value == 'deoxys') {
        value = "deoxys-normal";
    }
    if (value == 'giratina') {
        value = "giratina-altered";
    }
    if (value.length > 0) {
        toSearch.style.background = '#FFF';
        toggleSearchState(mainForm);
        var lateAnswer = idSelector("late-answer");
        removeClass(lateAnswer, 'pending');

        setTimeout(function () {
            if (!lateAnswer.classList.contains('pending')) {
                removeClass(lateAnswer, 'hidden');
            }
        }, 5000);

        getData(value, 'pokemon').then(function (data) {

            drawPokemon(data).then(function () {

                toggleSearchState(mainForm);
                addClass(lateAnswer, 'pending');
                addClass(lateAnswer, 'hidden');
            }).catch(function (error) {
                toggleSearchState(mainForm);
                alert(error);
            });
        }).catch(function (error) {
            toggleSearchState(mainForm);
            addClass(lateAnswer, 'pending');
            addClass(lateAnswer, 'hidden');
            alert(error + ' on "' + value + ' - Pokemon"');
        });
    } else {
        toSearch.style.background = '#FFFFCC';
        toSearch.focus();
    }
});

idSelector("birth-form").addEventListener("submit", function (event) {
    event.preventDefault();

    var birth = idSelector("birth-pkmn").value;
    var birthFirst = idSelector("birth-first").value;
    var birthLast = idSelector("birth-last").value;
    var birthSearchButton = idSelector("search-birth-pkmn");
    var birthForm = birthSearchButton.parentElement.children;

    if (isDate(birth)) {
        birth = addBirth(birth);
        var firstMultiplier = calculateMultiplier(birthFirst);
        var secondMultiplier = calculateMultiplier(birthLast);
        var multiplier = firstMultiplier + secondMultiplier;

        var result = (birth * multiplier).toFixed(0);

        if (result != 0) {

            var lateAnswer2 = idSelector("late-answer2");
            removeClass(lateAnswer2, 'pending');

            setTimeout(function () {
                if (!lateAnswer2.classList.contains('pending')) {
                    removeClass(lateAnswer2, 'hidden');
                }
            }, 5000);

            toggleSearchState(birthForm);

            getData(result, 'pokemon').then(function (data) {

                drawPokemon(data).then(function () {

                    toggleSearchState(birthForm);
                    addClass(lateAnswer2, 'pending');
                    addClass(lateAnswer2, 'hidden');
                }).catch(function (error) {
                    toggleSearchState(birthForm);
                    alert(error);
                });
            }).catch(function (error) {
                toggleSearchState(birthForm);
                addClass(lateAnswer2, 'pending');
                addClass(lateAnswer2, 'hidden');
                alert(error + ' on "' + value + ' - Pokemon"');
            });
        } else {
            alert("i think you are a digimon");
        }
    } else {
        alert("Error. Invalid date.");
    }
});

var scrollLinks = document.querySelectorAll(".smooth");
Object.values(scrollLinks).forEach(function (value, i) {
    value.addEventListener("click", function (event) {
        scrollIt(document.querySelector('.dest-smooth' + (i + 1)), 600);
    });
});

// FUNCTIONS
function idSelector(id) {
    return document.querySelector('#' + id);
}

function toggleSearchState(object) {
    var button;
    Object.values(object).map(function (index) {
        if (index.localName == "button") {
            button = index;
        }
    });

    if (button.disabled) {
        Object.values(object).map(function (index) {
            index.disabled = false;
            if (index.localName == "input" || index.localName == "textarea") {
                index.value = '';
            }
            if (index.localName == 'select') {
                index.selectedIndex = 0;
            }
        });
        addClass(button.querySelector('#loading'), 'hidden');
        removeClass(button.querySelector('#go'), 'hidden');
        button.disabled = false;
    } else {
        Object.values(object).map(function (index) {
            index.disabled = true;
        });
        addClass(button.querySelector('#go'), 'hidden');
        removeClass(button.querySelector('#loading'), 'hidden');
        button.disabled = true;
    }
}

function addClass(param, css) {
    if (!param.classList.contains(css)) {
        param.classList.add(css);
    }
}

function removeClass(param, css) {
    if (param.classList.contains(css)) {
        param.classList.remove(css);
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
    return num.length == 1 ? "0." + num : num.substring(0, num.length - 1) + "." + num.substr(-1);
}

function todayIs() {
    var date = new Date();
    var day = ('0' + date.getDate()).slice(-2),
        month = ('0' + (date.getMonth() + 1)).slice(-2),
        year = date.getFullYear().toString();
    return year + '-' + month + '-' + day;
}

function isDate(param) {
    return param.match(/^(\d{4})+(-)+(\d{2})+(-)+(\d{2})$/g);
}

function addBirth(date) {
    date = new Date(date);
    date.setDate(date.getDate() + 1);
    var day = ('0' + date.getDate()).slice(-2),
        month = ('0' + (date.getMonth() + 1)).slice(-2),
        year = date.getYear().toString().slice(-2);
    return parseInt(day) + parseInt(month) + parseInt(year);
}

function calculateMultiplier(num) {
    num = num.toString();
    return num.length > 1 ? parseFloat(num.charAt(0) + '.' + num.charAt(1)) : parseFloat('0' + '.' + num.charAt(0));
}

function getFromCache(id) {
    return localStorage.getItem(id) ? JSON.parse(localStorage.getItem(id)) : false;
}

function alphabet(selector) {
    for (var i = 0; i < 26; i++) {
        var letter = (i + 10).toString(36);
        var option = document.createElement("option");
        option.appendChild(document.createTextNode(letter.toUpperCase()));
        option.value = i + 1;
        selector.appendChild(option);
    }
}

function display(param) {
    console.log(param);
}

function scrollIt(destination) {
    var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;


    var start = window.pageYOffset;
    var startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    var documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
    var destinationOffset = typeof destination === 'number' ? destination : destination.offsetTop;
    var destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);

    if ('requestAnimationFrame' in window === false) {
        window.scroll(0, destinationOffsetToScroll);
        return;
    }

    function scroll() {
        var now = 'now' in window.performance ? performance.now() : new Date().getTime();
        var time = Math.min(1, (now - startTime) / duration);
        var timeFunction = time * (2 - time);
        window.scroll(0, Math.ceil(timeFunction * (destinationOffsetToScroll - start) + start));

        if (window.pageYOffset === destinationOffsetToScroll) {
            return;
        }

        requestAnimationFrame(scroll);
    }

    scroll();
}

// INITIALIZING
$('.carousel').carousel({
    interval: false
});

idSelector("birth-pkmn").max = todayIs();
alphabet(idSelector("birth-first"));
alphabet(idSelector("birth-last"));

//# sourceMappingURL=script.js.map