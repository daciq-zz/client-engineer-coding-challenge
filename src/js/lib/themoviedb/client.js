'use strict';

import Ajax from '../ajax/ajax.js';
import Utils from '../utils/utils.js';

const api_url = 'https://api.themoviedb.org/3/';

/** Class representing MoviesDb CLient */
class TheMovieDb {
    /**
    * Creates new
    * @constructor
    * @param {string} api_key
    */
    constructor(api_key) {
      this.api_key = api_key;
    }
    /**
    * Prepares query string for sending request
    * @function
    * @param {object} params POJO object with property:value pairs
    */
    prepareQuery(params){
      return Utils.query(Object.assign((this.api_key)?{'api_key': this.api_key}:{}, params));
    }
    /**
    * Prepares command for sending request
    * @function
    * @param {Array} command flat array with blocks of command
    */
    prepareCommand(command = []){
      var filtered = command.filter(function(element, index, array){
        return (element !== null && element !== '');
      });

      return filtered.join('/');
    }
    /**
    * Sends request
    * @function
    * @param {string} url - An url to loaded data
    * @param {function} done - Function called on success
    * @param {function} fail - Function called on failure
    */
    send(url, done, fail){
      Ajax.request(url, {
          method: 'GET',
          timeout: 5000,
          onDone: function(responseText, status, xhr){
            var data = JSON.parse(responseText);

            if((data.hasOwnProperty('status_code') && data.status_code !== 1) || data.hasOwnProperty('errors')){
              if(typeof done === 'function'){
                  fail(data);
              }
            }else{
              if(typeof done === 'function'){
                  done(data);
              }
            }
          },
          onFail: function(responseText, status, xhr){
            if(typeof fail === 'function'){
              fail(JSON.parse(responseText));
            }
          },
          onTimeout: function(responseText, status, xhr){
            if(typeof fail === 'function'){
              fail(JSON.parse('{"status_code":408,"status_message":"Request timed out"}'));
            }
          }
      });
    }
    /**
    * Sends command to Movie DB
    * @function
    * @param {Array} command - An url to loaded data
    * @param {object} params - POJO object with property:value pairs
    * @param {function} done - Function called on success
    * @param {function} fail - Function called on failure    *
    */
    callCommand(command, params, done, fail){
      var url = api_url+this.prepareCommand(command)+'?'+this.prepareQuery(params);

      this.send(url, done, fail);
    }
    getConfiguration(done, fail){
      this.callCommand(['configuration'], {}, done, fail);
    }
    search(params, done, fail){
      this.callCommand(['search', 'multi'], params, done, fail);
    }
    searchMovie(params, done, fail){
      this.callCommand(['search', 'movie'], params, done, fail);
    }
    searchCompany(params, done, fail){
      this.callCommand(['search', 'company'], params, done, fail);
    }
    searchPerson(params, done, fail){
      this.callCommand(['search', 'person'], params, done, fail);
    }
    searchTv(params, done, fail){
      this.callCommand(['search', 'tv'], params, done, fail);
    }
    getMovie(id, params, done, fail){
      this.callCommand(['movie', id], params, done, fail);
    }
    getCompany(id, params, done, fail){
      this.callCommand(['company', id], params, done, fail);
    }
    getPerson(id, params, done, fail){
      this.callCommand(['person', id], params, done, fail);
    }
    getTv(id, params, done, fail){
      this.callCommand(['tv', id], params, done, fail);
    }
    getGenres(type, params, done, fail){
      this.callCommand(['genre', type, 'list'], params, done, fail);
    }
}

export default TheMovieDb;
