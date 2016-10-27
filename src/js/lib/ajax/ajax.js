'use strict';

function xhrEventCallBack(xhr, type, fnc, args){
  xhr.addEventListener(type, function(evt){
    fnc.apply(xhr, args());
  });
}

/**
 * Utility to send ajax request
 */
const Ajax = {
  defaults: {
    async: true,
    method: 'GET',
    postBody: null,
    timeout: 5000,
    headers: {},
    onFail: function(responseText, status, xhr){},
    onDone: function(responseText, status, xhr){},
    onTimeout: null,
    onBeforeSend: function(xhr){},
    onAbort: function(xhr){}
  },
  /**
   * Get the red, green, and blue values of a color.
   * @function
   * @param {string} url - An url to loaded data
   * @param {object} [options={}] - An url to loaded data
   * @returns {XMLHttpRequest} Returns instance of xhr object
   */
  request(url, options = {}){
    var o = Object.assign({}, this.defaults, options),
        xhr = new XMLHttpRequest(),
        req = {};

    if(!url){
      return false;
    }

    xhr.open(o.method, url, o.async);

    for(let name in o.headers){
        xhr.setRequestHeader(name, o.headers[name]);
    }

    xhrEventCallBack(xhr, 'abort', o.onAbort, ()=>[xhr]);
    xhrEventCallBack(xhr, 'load', function(responseText, status, xhr){
      if(status===200){
        o.onDone.apply(xhr, [responseText, status, xhr]);
      }else{
        o.onFail.apply(xhr, [responseText, status, xhr]);
      }
    }, ()=>[xhr.responseText, xhr.status, xhr]);
    xhrEventCallBack(xhr, 'error', o.onFail, ()=>[xhr.responseText, xhr.status, xhr]);

    if(typeof o.onTimeout === 'function'){
      xhrEventCallBack(xhr, 'timeout', o.onTimeout, ()=>[xhr]);
    }else{
      xhrEventCallBack(xhr, 'timeout', o.onFail, ()=>[xhr.responseText, xhr.status, xhr]);
    }

    o.onBeforeSend.apply(xhr, [xhr]);

    switch(o.method){
      case 'GET': xhr.send(); break;
      case 'POST': xhr.send(JSON.stringify(o.postBody)); break;
      default: xhr.send();
    }

    return xhr;
  }
};

export default Ajax;
