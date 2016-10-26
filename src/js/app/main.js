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

function showLoader(){
  return transitionPromise(loader, loader.classList.contains('visible'), function(){
    loader.classList.add('visible');
  });
}

function hideLoader(){
  return transitionPromise(loader, !loader.classList.contains('visible'), function(){
    loader.classList.remove('visible');
  });
}

function hideSearch(){
  return transitionPromise(searchBox, true, function(){
    searchBox.classList.add('closed');
  });
}

function showSearch(){
  return transitionPromise(searchBox, true, function(){
    searchBox.classList.remove('closed');
  });
}

function transitionPromise(el, condition,trigger){
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

function theMovieDbPromise(command, params){
  return new Promise(function(resolve, reject){
    movieDbClient.callCommand(command, params, function(data){
      resolve(data);
    }, function(data){
      reject(data);
    });
  });
}

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

function buildNothingFound(data){
   return buildContentPromise(
     [
       'templates/results/nothing.html'
     ],
     data,
     renderNothingFound
   );
}

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

function renderNothingFound(data, templates){
  var nothing = templates[0];

  insertContent(nothing());
}

function insertContent(html){
  contentBox.innerHTML = html;
  document.getElementById('site-content').scrollTop = 0;
}

function onFormSubmit(e){
  var input = searchForm.querySelector('[type="search"]');

  e.preventDefault();

  if(input){
      Router.navigate('/search/'+input.value);
  }
}

function getPosterLink(path, size){
  if(!path){
    return false;
  }

  return configuration.images.base_url+size+path;
}

function getPosterImg(path, size){
  var poster = getPosterLink(path, size);

  if(!poster){
    return '';
  }

  return '<img src="'+poster+'" alt="" />';
}

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

function start(){
  loadInitialData().then(
    function(){
        Router.trigger();
    }
  );
}

document.addEventListener("DOMContentLoaded", init);
