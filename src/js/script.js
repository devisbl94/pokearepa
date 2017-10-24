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
                    localStorage.setItem(cacheKey, content)
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
            name,
            id,
            sprites: { front_default: image },
            types,
            stats
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
                        <div class="col-xs-8">
                            <div class = "row">
                                <div class="col-xs-4">
                                    <img class="img-responsive center-block" src="${image}" />
                                </div>
                                <div class="col-xs-8">
                                    <p>N° ${id}</p>
                                    <p>${capitalizeFirst(name)}</p>
                                    <p>Type: ${types.map( value => {

                                        return capitalizeFirst(value.type.name);

                                    }).toLocaleString().replace(',',' - ')}</p>
                                    <p>Egg groups: ${egg_groups.map( value => {

                                        return capitalizeFirst(value.name);

                                    }).toLocaleString().replace(',',' - ')}</p>
                                    <p>Habitat: ${capitalizeFirst(get_habitat)}</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-xs-12">
                                    <p>${flavorText}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-xs-4">
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
                resolve(true);
            }).catch(error => {
                reject(`${error} on "${name} - Pokedex"`)
            })
    })

    return promise;
}

idSelector("main-form").addEventListener("submit", (event) => {
    event.preventDefault();
    let toSearch = idSelector("search-pkmn");
    let value = toSearch.value.toLowerCase();
    if (value.length > 0) {
        toSearch.style.background = '#FFF';
        toggleSearchState(toSearch);

        getData(value, 'pokemon').then( data => {

            drawPokemon(data).then( () => {

                toggleSearchState(toSearch);
                $('#main-results').modal('show');

            }).catch( error => {
                toggleSearchState(toSearch);
                alert(error)
            });

        }).catch( error => {
            toggleSearchState(toSearch);
            alert(`${error} on "${value} - Pokemon"`)
        })

    } else {
        toSearch.style.background = '#FFFFCC';
        toSearch.focus();
    }
});

function idSelector(id) {
    return document.querySelector(`#${id}`);
}

function toggleSearchState(param){
    let button = param.nextElementSibling;
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

function roundStat(num){
    return Math.ceil((num * 100) / 190);
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// SIN USO
function setInCache(id, data) {
    localStorage.setItem(id, JSON.stringify(data));
}

function getFromCache(id) {
    return localStorage.getItem(id) ? JSON.parse(localStorage.getItem(id)) : false;
}

function display(param){
    console.log(param);
}