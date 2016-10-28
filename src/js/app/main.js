import Ajax from '../lib/ajax/ajax.js';
import Router from '../lib/router/router.js';
import TheMovieDb from '../lib/themoviedb/client.js';
import Utils from '../lib/utils/utils.js';

var movieDbClient,
    configuration,
    genres,
    searchBox,
    searchForm,
    loader,
    contentBox,
    templateCache = {};

Router.add('/search', showSearch);
Router.add('/search/:?', showResults);
Router.add('/search/:?/:?', showResults);
Router.add('/show/:?/:?', showItem);

/**
* Displays search results
* @param {object} query - POJO object with property:value pairs
* @param {number} page - results page number
* @function
* @returns {void}
*/
function showResults(query, page){
  hideSearch()
  .then(showLoader)
  .then(function(){
    return performSearch(query, page);
  })
  .then(buildResults, buildNothingFound)
  .then(function(){
    return loadImages(contentBox);
  })
  .then(hideLoader);
}

/**
* Displays movie or tv series info
* @param {string} type - movie or tv
* @param {number} id - movie or tv series movie db identifier
* @function
* @returns {void}
*/
function showItem(type, id){
  hideSearch()
  .then(showLoader)
  .then(function(){
      return performFetchInfo(type, id);
  })
  .then(function(data){
      switch(type){
        case 'tv': return buildTvInfo(data);
        case 'movie': return buildMovieInfo(data);
      }
  }, buildNothingFound)
  .then(function(){
    return loadImages(contentBox);
  })
  .then(hideLoader);
}

/**
* Displays loader
* @function
* @returns {Promise}
*/
function showLoader(){
  return transitionPromise(loader, loader.classList.contains('visible'), function(){
    loader.classList.add('visible');
  });
}

/**
* Hides loader
* @function
* @returns {Promise}
*/
function hideLoader(){
  return transitionPromise(loader, !loader.classList.contains('visible'), function(){
    loader.classList.remove('visible');
  });
}

/**
* Hides search form
* @function
* @returns {Promise}
*/
function hideSearch(){
  return transitionPromise(searchBox, true, function(){
    searchBox.classList.add('closed');
  });
}

/**
* Displays search form
* @function
* @returns {Promise}
*/
function showSearch(){
  return transitionPromise(searchBox, true, function(){
    searchBox.classList.remove('closed');
  });
}

/**
* Loads data from movies db
* @function
* @param {object} el - element to listen transtion end event
* @param {boolean} condition - is in state after transition
* @param {function} trigger - function to call on transition end
* @returns {Promise}
*/
function transitionPromise(el, condition, trigger){
  return new Promise(function(resolve, reject){
    if(condition){
      resolve();
    }

    function handleTransEnd(){
      el.removeEventListener("transitionend", handleTransEnd);
      resolve();
    }

    el.addEventListener("transitionend", handleTransEnd);
    trigger.apply({}, [el]);
  });
}

/**
* Loads data from movies db
* @function
* @param {array} command - array of movie db command path chunks
* @param {object} params - POJO object with property:value pairs
* @returns {Promise}
*/
function theMovieDbPromise(command, params){
  return new Promise(function(resolve, reject){
    movieDbClient.callCommand(command, params, function(data){
      resolve(data);
    }, function(data){
      reject(data);
    });
  });
}

/**
* Returns Promise to build content
* @function
* @param {array} loadTemplates - array of template urls to load
* @param {object} data - data to build contetn
* @param {function} fnc - function to handle Promise
* @returns {Promise}
*/
function buildContentPromise(loadTemplates = [], data, fnc){
  return new Promise(function(resolve, reject){
    var toLoad = [];

    loadTemplates.forEach(function(item){
      toLoad.push(loadTemplatePromise(item));
    });

    Promise.all(toLoad).then(
        function(templates){
          fnc.apply({},[data, templates, resolve, reject]);
          resolve();
        },
        function(){
          reject();
        }
    );
  });
}

/**
* Loads html template
* @function
* @param {object} url - url for template
* @returns {Promise}
*/
function loadTemplatePromise(url){
  return new Promise(function(resolve, reject){
    var request;

    if(templateCache[url]){
      resolve(templateCache[url]);
      return;
    }

    request = Ajax.request(url, {
      onDone: function(responseText){
        templateCache[url] = Utils.template(responseText);
        resolve(templateCache[url]);
      },
      onFail: function(){
          reject();
      }
    });
  });
}

/**
* Loads all base application data
* @function
* @returns {Promise}
*/
function loadInitialData(){
  return new Promise(function(resolve, reject){
    Promise.all([
      theMovieDbPromise(['configuration'], {}),
      theMovieDbPromise(['genre', 'tv', 'list'], {}),
      theMovieDbPromise(['genre', 'movie', 'list'], {})
    ]).then(
      function(values){
        configuration = values[0];
        genres = {
          tv: values[1].genres,
          movie: values[2].genres
        };
        resolve();
      },
      reject
    );
  });
}

/**
* Loads all images from parent eleemnt
* @function
* @param {object} parent - html parent element
* @returns {Promise}
*/
function loadImages(parent){
  var imgs = parent.querySelectorAll('img');

  return new Promise(function(resolve, reject){
    var toLoad = [];

    [...imgs].forEach(function(item){
      toLoad.push(loadImagePromise(item));
    });

    Promise.all(toLoad).then(resolve, resolve);
  });
}

/**
* Loads image
* @function
* @param {object} img - html image element
* @returns {Promise}
*/
function loadImagePromise(img){
  return new Promise(function(resolve, reject){
    if(img.complete && img.naturalWidth > 0){
      resolve(img);
      return;
    }

    img.addEventListener('load', function(){
      resolve(img);
    });

    img.addEventListener('error', function(){
      reject(img);
    });
  });
}

/**
* Performs multi search in movie db
* @function
* @param {object} query - POJO object with property:value pairs
* @param {number} page - results page number
* @returns {Promise}
*/
function performSearch(query, page){
  return theMovieDbPromise(['search', 'multi'], {
          query: query,
          page: (page)?page:1
  }).then(function(data){
    return new Promise(function(resolve, reject){
      if(data.hasOwnProperty('results') && data.results.length){
        resolve(data);
      }else{
        reject(data);
      }
    });
  });
}

/**
* Gets info for tv series or movie
* @function
* @param {string} type - movie or tv
* @param {number} id - movie or tv series movie db identifier
* @returns {Promise}
*/
function performFetchInfo(type, id){
  return new Promise(function(resolve, reject){
    Promise.all([
      theMovieDbPromise([type, id], {
        append_to_response: 1
      }),
      theMovieDbPromise([type, id, 'credits'], {})
    ]).then(
      function(values){
        var data = {
          basic: values[0],
          credits: values[1],
        };
        resolve(data);
      },
      reject
    );
  });
}

/**
* Loads templates and builds displayed content for search results list
* @function
* @param {object} data - data for template functions
* @returns {void}
*/
function buildResults(data){
  return buildContentPromise(
      [
        'templates/results/body.html',
        'templates/results/movie.html',
        'templates/results/tv.html',
        'templates/results/empty.html',
        'templates/results/pagination.html'
      ],
      data,
      renderResults
  );
}

/**
* Loads templates and builds displayed content for 'nothing found' info
* @function
* @param {object} data - data for template functions
* @returns {void}
*/
function buildNothingFound(data){
   return buildContentPromise(
     [
       'templates/results/nothing.html'
     ],
     data,
     renderNothingFound
   );
}

/**
* Loads templates and builds displayed content for movie info
* @function
* @param {object} data - data for template functions
* @returns {void}
*/
function buildMovieInfo(data){
   return buildContentPromise(
     [
       'templates/show/movie.html',
       'templates/show/cast.html'
     ],
     data,
     renderMovieInfo
   );
}

/**
* Loads templates and builds displayed content for tv series info
* @function
* @param {object} data - data for template functions
* @returns {void}
*/
function buildTvInfo(data){
   return buildContentPromise(
     [
       'templates/show/tv.html',
       'templates/show/cast.html'
     ],
     data,
     renderTvInfo
   );
}

/**
* Inserts search results in contentBox
* @function
* @param {object} data - data for template functions
* @param {Array} templates - template functions to render html
* @returns {void}
*/
function renderResults(data, templates){
  var body = templates[0],
      parts = {
        movie: templates[1],
        tv: templates[2]
      },
      empty =  templates[3],
      pagination = templates[4],
      base = '',
      content = '';

  data.results.forEach(function(chunk){
    let template;

    if(parts.hasOwnProperty(chunk.media_type)){
      template = parts[chunk.media_type];
    }else{
      template = empty;
    }

    content += template(
      Object.assign(
        {},
        chunk,
        {
          poster: getPosterImg(chunk.poster_path, 'w185_and_h278_bestv2'),
          genre: (chunk.hasOwnProperty('genre_ids') && chunk.genre_ids[0])?getGenre(chunk.media_type, chunk.genre_ids[0]):'',
          overview: (chunk.hasOwnProperty('overview') && chunk.overview !== '')?chunk.overview.slice(0, 300):''
        }
      )
    );
  });

  base = window.location.hash.split('/').slice(0,3).join('/');

  insertContent(body({
      list: content,
      pagination: pagination({
        links: getPaginationLinks(base, data.total_pages)
      })
  }));
}

/**
* Inserts movie info in contentBox
* @function
* @param {object} data - data for template functions
* @param {Array} templates - template functions to render html
* @returns {void}
*/
function renderMovieInfo(data, templates){
  var template = templates[0];

  insertContent(template(
    Object.assign(
      {},
      data,
      {
        title: data.basic.original_title,
        overview: data.basic.overview,
        year: data.basic.release_date.slice(0,4),
        genres: data.basic.genres.reduce(function(prev, current){
          return prev += ((prev==='')?'':', ')+current.name;
        }, ''),
        poster: getPosterImg(data.basic.poster_path, 'w300_and_h450_bestv2'),
        cast: getCast(data.credits.cast, templates[1]),
        credits: getCast(data.credits.crew, templates[1])
      }
    )
  ));
}

/**
* Inserts tv series info in contentBox
* @function
* @param {object} data - data for template functions
* @param {Array} templates - template functions to render html
* @returns {void}
*/
function renderTvInfo(data, templates){
  var template = templates[0];

  insertContent(template(
    Object.assign(
      {},
      data,
      {
        title: data.basic.original_name,
        overview: data.basic.overview,
        year: data.basic.first_air_date.slice(0,4),
        genres: data.basic.genres.reduce(function(prev, current){
          return prev += ((prev==='')?'':', ')+current.name;
        }, ''),
        poster: getPosterImg(data.basic.poster_path, 'w300_and_h450_bestv2'),
        cast: getCast(data.credits.cast, templates[1]),
        credits: getCast(data.credits.crew, templates[1])
      }
    )
  ));
}

/**
* Inserts 'Nothing found' in contentBox
* @function
* @param {object} data - data for template functions
* @param {Array} templates - template functions to render html
* @returns {void}
*/
function renderNothingFound(data, templates){
  var nothing = templates[0];

  insertContent(nothing());
}

/**
* Inserts html in contentBox
* @function
* @param {string} html - html string to insert in contentBox
* @returns {void}
*/
function insertContent(html){
  contentBox.innerHTML = html;
  document.getElementById('site-content').scrollTop = 0;
}

/**
* Listens onSubmit event
* @function
* @param {object} e - form submit event object
* @returns {void}
*/
function onFormSubmit(e){
  var input = searchForm.querySelector('[type="search"]');

  e.preventDefault();

  if(input){
      Router.navigate('/search/'+input.value);
  }
}

/**
* Returns url for poster image
* @function
* @param {string} path - movie db image path
* @param {string} size - movie db image size identifier
* @returns {string}
*/
function getPosterLink(path, size){
  if(!path){
    return false;
  }

  return configuration.images.base_url+size+path;
}

/**
* Returns html for poster image
* @function
* @param {string} path - movie db image path
* @param {string} size - movie db image size identifier
* @returns {string}
*/
function getPosterImg(path, size){
  var poster = getPosterLink(path, size);

  if(!poster){
    return '';
  }

  return '<img src="'+poster+'" alt="" />';
}

/**
* Returns movie or tv genre based on id
* @function
* @param {string} type - movie or tv
* @param {number} id - genre id
* @returns {string}
*/
function getGenre(type, id){
  var filtered = genres[type].filter(function(item){
      return item.id === id;
  });

  if(filtered.length){
    return filtered[0].name;
  }else{
    return '';
  }
}

/**
* Returns html for pagination links
* @function
* @param {string} base - Base url
* @param {number} pages - Number of pages
* @returns {string}
*/
function getPaginationLinks(base, pages){
  var links = '';

  if(pages <= 1){
    return '';
  }

  for(let i = 1; i <= pages; i++){
    links += '<a class="button" href="'+base+'/'+i+'">'+i+'</a>';
  }

  return links;
}

/**
* Returns html for displaying cast and crew members
* @function
* @param {object} data POJO object with property:value pairs
* @param {function} template Function for rendering html output
* @returns {string}
*/
function getCast(data, template){
  var content = '';

  data.slice(0,10).forEach(function(item){
      content += template(
        Object.assign(
          item,
          {poster:getPosterImg(item.profile_path, 'w132_and_h132_bestv2')}
        )
      );
  });

  return content;
}

/**
* Inits variables and event listeners
* @function
* @returns {void}
*/
function init(){
  var apiKey = document.body.dataset['apiKey'],
      querySelector = document.querySelector;

  if(!apiKey){
    return;
  }

  movieDbClient = new TheMovieDb(apiKey);
  searchBox = document.querySelector('.search-box');
  contentBox = document.querySelector('.content-box');
  searchForm = document.querySelector('.search-form');
  loader = document.querySelector('.loader');

  Router.listen();

  window.addEventListener("load", start);
  searchForm.addEventListener("submit", onFormSubmit);
}

/**
* Starts application after window load
* @function
* @returns {void}
*/
function start(){
  loadInitialData().then(
    function(){
        Router.trigger();
    }
  );
}

document.addEventListener("DOMContentLoaded", init);
