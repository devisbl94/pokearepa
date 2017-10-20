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
          sessionStorage.setItem(cacheKey, content);
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
  results.innerHTML += '\n    <span class="col-xs-4">\n      <p>N\xB0 ' + id + '</p>\n      <p>' + name + '</p>\n      <p>' + types.map(function (index) {
    return index.type.name;
  }).toLocaleString().replace(',', ' - ') + '</p>\n      <img src="' + image + '" />\n    </span>\n  ';
};

idSelector("main-form").addEventListener("submit", function (event) {
  event.preventDefault();
  var toSearch = idSelector("search-pkmn");
  var panelResults = idSelector("panel-results");
  var value = toSearch.value.toLowerCase();
  toSearch.disabled = true;
  getData(value, 'pokemon').then(function (data) {
    drawPokemon(data);
    if (panelResults.classList.contains('hidden')) {
      panelResults.classList.remove('hidden');
    }
    toSearch.value = '';
    toSearch.disabled = false;
  });
});

function idSelector(id) {
  return document.querySelector('#' + id);
}

// SIN USO
function setInCache(id, data) {
  localStorage.setItem(id, JSON.stringify(data));
}

function getFromCache(id) {
  return localStorage.getItem(id) ? JSON.parse(localStorage.getItem(id)) : false;
}

//# sourceMappingURL=script.js.map