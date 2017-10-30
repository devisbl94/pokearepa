// URLs
const baseURL = 'https://pokeapi.co/api/v2/';
const pokemonURL = identifier => `${baseURL}pokemon/${identifier}/`;
const pokedexEntry = identifier => `${baseURL}pokemon-species/${identifier}/`;
const typeDesc = identifier => `${baseURL}type/${identifier}/`;

// PRINCIPAL
const getData = (param, toGet) => {
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
    let cacheKey = param
    let cached = getFromCache(cacheKey)
    if (cached) {
        return Promise.resolve(cached)
    }
    return fetch(param).then(response => {
        if (response.ok && response.status == 200) {
            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/json')) {
                response.clone().text().then(content => {
                    try {
                        localStorage.setItem(cacheKey, content);
                    } catch(e) {
                        display("cache has been cleaned");
                        localStorage.clear();
                        localStorage.setItem(cacheKey, content);
                    }
                })
                return response.json().catch(error => {
                    return Promise.reject('Invalid JSON: ' + error.message);
                });
            } else {
                return Promise.reject('Invalid content type: ' + contentType)
            }
        } else if (response.status == 400) {
            return Promise.reject('Page not found: ' + url);
        } else {
            return Promise.reject('HTTP error: ' + response.status);
        }
    }).catch(error => {
        return Promise.reject('Connection error: ' + error.message);
    });
}

const drawPokemon = pokemonData => {
    let promise = new Promise( (resolve, reject) => {

        const {
            species: { name: name },
            id,
            sprites: { front_default: image },
            types,
            stats,
            abilities,
            height,
            weight
        } = pokemonData;

        getData(name, 'pokedex')
            .then(entry => {

                const {
                    habitat,
                    egg_groups,
                    flavor_text_entries,
                    genera
                } = entry;

                let get_habitat = habitat == null ? 'none' : habitat.name;

                let flavorText = false;
                flavor_text_entries.map( index => {
                    if (index.language.name == "en" && flavorText == false) {
                        flavorText = index.flavor_text;
                    }
                });

                let generaDesc = false;
                genera.map( index => {
                    if (index.language.name == "en" && generaDesc == false) {
                        generaDesc = index.genus;
                    }
                });

                const results = idSelector('results');
                results.innerHTML = `
                    <div class="row">
                        <div class="col-xs-12 col-sm-8">
                            <div class="row">
                                <div class="col-xs-4">
                                    <img class="img-responsive center-block" src="${image}" />
                                </div>
                                <div class="col-xs-8">
                                    <p><b>N° ${id} - ${capitalizeFirst(name)}</b><br>
                                    ${generaDesc}</p>
                                    <p><b>Type:</b><br> ${types.reverse().map( value => {
                                        return capitalizeFirst(value.type.name);
                                    }).toLocaleString().replace(',',' - ')}</p>
                                    <p><b>Abilities:</b><br> ${abilities.reverse().map( value => {
                                        return (value.is_hidden ? ` (HA) ` : '') + capitalizeFirst(value.ability.name);
                                    }).toLocaleString().replace(',',' - ')}</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-xs-6">
                                    <p><b>Weight:</b><br> ${decimalFormat(weight)} kg</p>
                                </div>
                                <div class="col-xs-6">
                                    <p><b>Height:</b><br> ${decimalFormat(height)} m</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-xs-6">
                                    <p><b>Egg groups:</b><br> ${egg_groups.reverse().map( value => {
                                        return lastIsNumber(capitalizeFirst(value.name));
                                    }).toLocaleString().replace(',',' - ')}</p>
                                </div>
                                <div class="col-xs-6">
                                    <p><b>Habitat:</b><br> ${capitalizeFirst(get_habitat)}</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-xs-12">
                                    <p>${flavorText}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-4 hidden-xs">
                            ${stats.reverse().map( value => {

                                return `
                                    <span class="tiny">${value.stat.name.toUpperCase()} </span>
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" style="width: ${roundStat(value.base_stat)}%">
                                            ${value.base_stat}
                                        </div>
                                    </div>`

                            }).toLocaleString().replace(/(,)/g,'')}
                        </div>
                    </div>
                `;
                $('#main-results').modal('show');
                resolve(true);
            }).catch(error => {
                reject(`${error} on "${name} - Pokedex"`)
            })
    })

    return promise;
}

// EVENTS
idSelector("main-form").addEventListener("submit", (event) => {
    event.preventDefault();
    let toSearch = idSelector("search-pkmn");
    let mainForm = toSearch.parentElement.children;
    let value = toSearch.value.toLowerCase();
    if (value == 'deoxys') {
        value = "deoxys-normal";
    }
    if (value == 'giratina') {
        value = "giratina-altered";
    }
    if (value.length > 0) {
        toSearch.style.background = '#FFF';
        toggleSearchState(mainForm);
        let lateAnswer = idSelector("late-answer");
        removeClass(lateAnswer, 'pending');

        setTimeout( () => {
            if (!lateAnswer.classList.contains('pending')) {
                removeClass(lateAnswer, 'hidden');
            }
        }, 5000);

        getData(value, 'pokemon').then( data => {

            drawPokemon(data).then( () => {

                toggleSearchState(mainForm);
                addClass(lateAnswer, 'pending');
                addClass(lateAnswer, 'hidden');

            }).catch( error => {
                toggleSearchState(mainForm);
                display(error);
                alert("Something weird happened. Try again!");
            });

        }).catch( error => {
            toggleSearchState(mainForm);
            addClass(lateAnswer, 'pending');
            addClass(lateAnswer, 'hidden');
            // alert(`${error} on "${value} - Pokemon"`);
            display(error);
            alert(`"${value}" does not exist. Try again!`);
        })

    } else {
        toSearch.style.background = '#FFFFCC';
        toSearch.focus();
    }
});

idSelector("birth-form").addEventListener("submit", (event) => {
    event.preventDefault();

    let birth = idSelector("birth-pkmn").value;
    let birthFirst = idSelector("birth-first").value;
    let birthLast = idSelector("birth-last").value;
    let birthSearchButton = idSelector("search-birth-pkmn");
    let birthForm = birthSearchButton.parentElement.children;

    if (isDate(birth)) {
        birth = addBirth(birth);
        let firstMultiplier = calculateMultiplier(birthFirst);
        let secondMultiplier = calculateMultiplier(birthLast);
        let multiplier = firstMultiplier + secondMultiplier;

        let result = (birth * multiplier).toFixed(0);

        if (result != 0) {

            let lateAnswer2 = idSelector("late-answer2");
            removeClass(lateAnswer2, 'pending');

            setTimeout( () => {
                if (!lateAnswer2.classList.contains('pending')) {
                    removeClass(lateAnswer2, 'hidden');
                }
            }, 5000);

            toggleSearchState(birthForm);

            getData(result, 'pokemon').then( data => {

                drawPokemon(data).then( () => {

                    toggleSearchState(birthForm);
                    addClass(lateAnswer2, 'pending');
                    addClass(lateAnswer2, 'hidden');

                }).catch( error => {
                    toggleSearchState(birthForm);
                    alert(error)
                });

            }).catch( error => {
                toggleSearchState(birthForm);
                addClass(lateAnswer2, 'pending');
                addClass(lateAnswer2, 'hidden');
                display(`${error} on "${value} - Pokemon"`);
                alert("Something weird happened. Try again!");
            })

        } else {
            alert("i think you are a digimon");
        }
    } else {
        alert("Error. Invalid date.")
    }
})

let scrollLinks = document.querySelectorAll(".smooth");
Object.values(scrollLinks).forEach( (value, i) => {
    value.addEventListener("click", event => {
        scrollIt(
            document.querySelector('.dest-smooth' + (i+1)),
            600
        );
    })
})


// FUNCTIONS
function idSelector(id) {
    return document.querySelector(`#${id}`);
}

function toggleSearchState(object){
    var button;
    Object.values(object).map( index => {
        if (index.localName == "button") {
            button = index;
        }
    });

    if (button.disabled) {
        Object.values(object).map( index => {
            index.disabled = false;
            if (index.localName == "input" || index.localName == "textarea") {
                index.value = '';
            }
            if (index.localName == 'select'){
                index.selectedIndex = 0;
            }
        })
        addClass(button.querySelector('#loading'), 'hidden');
        removeClass(button.querySelector('#go'), 'hidden');
        button.disabled = false;
    } else {
        Object.values(object).map( index => {
            index.disabled = true;
        })
        addClass(button.querySelector('#go'), 'hidden');
        removeClass(button.querySelector('#loading'), 'hidden')
        button.disabled = true;
    }
}

function addClass(param, css){
    if (!param.classList.contains(css)) {
        param.classList.add(css)
    }
}

function removeClass(param, css){
    if (param.classList.contains(css)) {
        param.classList.remove(css)
    }
}

function roundStat(num){
    return Math.ceil((num * 100) / 190);
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lastIsNumber(string){
    return isNaN(string.slice(-1)) ? string : string.slice(0, string.length-1) + ' ' + string.slice(-1)
}

function decimalFormat(num) {
    num = num.toString();
    return num.length == 1 ?  "0." + num : num.substring(0, num.length-1) + "." + num.substr(-1);
}

function todayIs(){
    let date = new Date();
    var day = ('0' + date.getDate()).slice(-2),
        month = ('0' + (date.getMonth() + 1)).slice(-2),
        year = date.getFullYear().toString();
    return `${year}-${month}-${day}`;
}

function isDate(param){
    return param.match(/^(\d{4})+(-)+(\d{2})+(-)+(\d{2})$/g);
}

function addBirth(date){
    date = new Date(date);
    date.setDate(date.getDate() + 1);
    var day = ('0' + date.getDate()).slice(-2),
        month = ('0' + (date.getMonth() + 1)).slice(-2),
        year = date.getYear().toString().slice(-2);
    return parseInt(day) + parseInt(month) + parseInt(year);
}

function calculateMultiplier(num){
    num = num.toString();
    return num.length > 1 ? parseFloat(num.charAt(0) + '.' + num.charAt(1)) : parseFloat('0' + '.' + num.charAt(0))
}

function getFromCache(id) {
    return localStorage.getItem(id) ? JSON.parse(localStorage.getItem(id)) : false;
}

function alphabet(selector){
    for(var i=0; i<26; i++) {
        let letter = (i+10).toString(36);
        let option = document.createElement("option");
        option.appendChild(document.createTextNode(letter.toUpperCase()));
        option.value = i+1;
        selector.appendChild(option);
    }
}

function display(param){
    console.log(param);
}

function scrollIt(destination, duration = 200) {

    const start = window.pageYOffset;
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
    const destinationOffset = typeof destination === 'number' ? destination : destination.offsetTop;
    const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);

    if ('requestAnimationFrame' in window === false) {
        window.scroll(0, destinationOffsetToScroll);
        return;
    }

    function scroll() {
        const now = 'now' in window.performance ? performance.now() : new Date().getTime();
        const time = Math.min(1, ((now - startTime) / duration));
        const timeFunction = time * (2 - time);
        window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start));

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