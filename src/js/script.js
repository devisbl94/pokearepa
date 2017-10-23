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
        return Promise.reject(error.message);
    });
}

const returnPromises = object => {
    let length = object.length,
        array = [],
        promise = new Promise( (resolve, reject) => {
            object.forEach( index => {
                index.then( value => {
                    array.push(value[0]);
                    if (array.length == length) {
                        resolve(array);
                    }
                })
            })
    });
    return promise;
}

const drawPokemon = pokemonData => {
    let promise = new Promise( (resolve, reject) => {
        const {
            name,
            id,
            sprites: { front_default: image },
            types
        } = pokemonData;

        let lang_types = types.map( index => {
           return getData(index.type.name, "type")
                .then( type => {
                    return type.names.filter(value => {
                        return value.language.name == "es"
                    })
                })
        })

        returnPromises(lang_types).then( tipos => {
            setTimeout( () => {
                const results = idSelector('results');
                results.innerHTML = `
                    <div class = "row">
                        <div class="col-sm-3">
                            <img class="img-responsive" src="${image}" />
                        </div>
                        <div class="col-sm-3">
                            <p>N° ${id}</p>
                            <p>${name}</p>
                            <p>Tipo: ${tipos.map( type => {
                                return type.name;
                            }).toLocaleString().replace(',',' - ')}</p>
                        </div>
                    </div>
                `;
                resolve(true);
            }, 0)
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
            });
        }).catch( error => {
            toggleSearchState(toSearch);
            alert(`Error de conexión.`)
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