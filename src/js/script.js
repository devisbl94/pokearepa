const baseURL = 'https://pokeapi.co/api/v2/';
const pokemonURL = identifier => `${baseURL}pokemon/${identifier}/`;
const pokedexEntry = identifier => `${baseURL}pokemon-species/${identifier}/`;
const typeDesc = identifier => `${baseURL}type/${identifier}/`;

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
                    if(localStorage.setItem(cacheKey, content)){
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

        // let lang_types = types.map( index => {
        //    return getData(index.type.name, "type")
        //         .then( type => {
        //             return type.names.filter(value => {
        //                 return value.language.name == "es"
        //             })
        //         })
        // })

        getData(name, 'pokedex')
            .then(entry => {

                const {
                    habitat,
                    egg_groups,
                    flavor_text_entries,
                } = entry;

                let get_habitat = habitat == null ? 'none' : habitat.name;

                let flavorText = false;
                flavor_text_entries.map( index => {
                    if (index.language.name == "en" && flavorText == false) {
                        flavorText = index.flavor_text;
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
                                    <p><b>N° ${id} - ${capitalizeFirst(name)}</b></p>
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

alphabet(idSelector("birth-first"));
alphabet(idSelector("birth-last"));

idSelector("main-form").addEventListener("submit", (event) => {
    event.preventDefault();
    let toSearch = idSelector("search-pkmn");
    let value = toSearch.value.toLowerCase();
    if (value == 'deoxys') {
        value = "deoxys-normal";
    }
    if (value == 'giratina') {
        value = "giratina-altered";
    }
    if (value.length > 0) {
        toSearch.style.background = '#FFF';
        toggleSearchState(toSearch);
        let lateAnswer = idSelector("late-answer");
        removeClass(lateAnswer, 'pending');

        setTimeout( () => {
            if (!lateAnswer.classList.contains('pending')) {
                removeClass(lateAnswer, 'hidden');
            }
        }, 5000);

        getData(value, 'pokemon').then( data => {

            drawPokemon(data).then( () => {

                toggleSearchState(toSearch);
                addClass(lateAnswer, 'pending');
                addClass(lateAnswer, 'hidden');

            }).catch( error => {
                toggleSearchState(toSearch);
                alert(error)
            });

        }).catch( error => {
            toggleSearchState(toSearch);
            addClass(lateAnswer, 'pending');
            addClass(lateAnswer, 'hidden');
            alert(`${error} on "${value} - Pokemon"`);
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

    birth = addBirth(birth);
    let firstMultiplier = calculateMultiplier(birthFirst);
    let secondMultiplier = calculateMultiplier(birthLast);
    let multiplier = firstMultiplier + secondMultiplier;

    let result = (birth * multiplier).toFixed(0);

    if (result != 0) {

        getData(result, 'pokemon').then( data => {

            drawPokemon(data).then( () => {

                display("done");

            }).catch( error => {
                toggleSearchState(toSearch);
                alert(error)
            });

        }).catch( error => {
            alert(`${error} on "${value} - Pokemon"`);
        })

    } else {
        alert("i think you are a digimon");
    }

})

function idSelector(id) {
    return document.querySelector(`#${id}`);
}

function toggleSearchState(param){
    let button = param.nextElementSibling;
    if (param.disabled) {
        addClass(button.querySelector('#loading'), 'hidden');
        removeClass(button.querySelector('#go'), 'hidden')
        param.disabled = false;
        button.disabled = false;
        param.value = '';
    } else {
        addClass(button.querySelector('#go'), 'hidden');
        removeClass(button.querySelector('#loading'), 'hidden')
        param.disabled = true;
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

function addBirth(date){
    date = new Date(date);
    date.setDate(date.getDate() + 1)
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2)
    var year = date.getYear().toString().slice(-2);
    return parseInt(day) + parseInt(month) + parseInt(year);
}

function calculateMultiplier(num){
    num = num.toString();
    return num.length > 1 ? parseFloat(num.charAt(0) + '.' + num.charAt(1)) : parseFloat('0' + '.' + num.charAt(0))
}

// SIN USO
function setInCache(id, data) {
    localStorage.setItem(id, JSON.stringify(data));
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

$('.carousel').carousel({
    interval: false
});