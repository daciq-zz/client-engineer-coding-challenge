'use strict';

/**
 * Application router
 * @type {object}
 * @property {function(route: string, fnc: function)} add - Registers new route
 * @property {function(url: string)} remove - Removes route
 * @property {function(): object} getRoutes - Returns all registered routes
 * @property {function()} flush - Removes all registered routes
 * @property {function()} listen - It starts to listen hashchangeevent
 * @property {function()} stop - It stops to listen hashchangeevent
 * @property {function()} getHash - Returns current hash
 * @property {function(pattern: string): string} build - Compiles route pattern string (/test/:?/:?/) to regular expression pattern string
 * @property {function(hash: string): object} search - Returns handler object if hash matches any route
 * @property {function(path: string)} navigate - Sets new window.location.hash
 * @property {function()} trigger - Triggers handler for current window.location.hash
 */
const Router = {
  routes: {},
  listener: null,
  add(route, fnc){
    this.routes[route] = fnc;

    return this;
  },
  remove(route){
    delete this.routes[route];

    return this;
  },
  getRoutes(){
      return this.routes;
  },
  flush(){
      this.routes = {};

      return this;
  },
  listen() {
    this.listener = (function(event){
      this.trigger();
  	}).bind(this);

    window.addEventListener("hashchange",this.listener);

    return this;
  },
  stop(){
    if(this.listener){
        window.removeEventListener("hashchange",this.listener);
        this.listener = null;
    }

    return this;
  },
  getHash(){
    return window.location.hash.slice(1);
  },
  build(route){
    return '^'+(route.replace(/\:\?/g,'([^/]+)'))+'$';
  },
  search(hash){
    for(let route in this.routes){
      let pattern =  this.build(route),
          match = hash.match(new RegExp(pattern));

      if(match){
        return {
            route: route,
            pattern: pattern,
            params: match.slice(1),
            callback: this.routes[route]
        };
      }
    }

    return null;
  },
  navigate(path) {
    window.location.hash = path;

    return this;
  },
  trigger(){
    var hash = this.getHash(), handler;

    handler = this.search(hash);

    if(handler){
      handler.callback.apply(handler, handler.params);
    }

    return this;
  }
};

export default Router;
