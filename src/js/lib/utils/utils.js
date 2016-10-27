'use strict';

const expect = chai.expect;

const Utils = {
  /**
   * Returns query string
   * @function
   * @param {object} params - POJO object with property:value pairs
   * @returns {string} query string 
   */
  query(params = {}){
    var query = [];

    for(let name in params){
        query.push(encodeURIComponent(name)+'='+encodeURIComponent(params[name]));
    }

    return query.join('&');
  },
  /**
   * Returns template function
   * @function
   * @param {string} string - template string
   * @returns {function}
   */
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
