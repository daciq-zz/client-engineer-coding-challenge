'use strict';

/**
 * Common functions
 * @type {object}
 * @property {function(params: object): string} query - Returns query string
 * @property {function(params: string): function} template - Returns template function
 */
const Utils = {
  query(params = {}){
    var query = [];

    for(let name in params){
        query.push(encodeURIComponent(name)+'='+encodeURIComponent(params[name]));
    }

    return query.join('&');
  },
  template(string){
    var tmpl = string;

    return function(data){
      var re = /<%([^%>]+)?%>/g, match, copy = tmpl;

      while(match = re.exec(copy)) {
          copy = copy.replace(match[0], data[match[1].trim()])
      }

      return copy;
    }
  }
};

export default Utils;
