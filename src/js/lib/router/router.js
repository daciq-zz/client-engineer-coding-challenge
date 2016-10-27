/**
 * Utility co create routes based on window.location.hash
 */
const Router = {
  routes: {},
  listener: null,
  /**
   * Registers new route
   * @function
   * @param {string} route - route pattern; /:?/:?
   * @param {function} fnc - callback triggered when route matches
   * @returns {this}
   */
  add(route, fnc){
    this.routes[route] = fnc;

    return this;
  },
  /**
   * Removes route
   * @function
   * @param {string} route - route pattern; /:?/:?
   * @returns {this}
   */
  remove(route){
    delete this.routes[route];

    return this;
  },
  /**
   * Returns all registered routes
   * @function
   * @returns {object} Object with route:function pairs
   */
  getRoutes(){
      return this.routes;
  },
  /**
   * Removes all registered routes
   * @function
   * @returns {this}
   */
  flush(){
      this.routes = {};

      return this;
  },
  /**
   * It starts to listen hashchangeevent
   * @function
   * @returns {this}
   */
  listen() {
    this.listener = (function(event){
      this.trigger();
  	}).bind(this);

    window.addEventListener("hashchange",this.listener);

    return this;
  },
  /**
   * It stops to listen hashchangeevent
   * @function
   * @returns {this}
   */
  stop(){
    if(this.listener){
        window.removeEventListener("hashchange",this.listener);
        this.listener = null;
    }

    return this;
  },
  /**
   * Returns current hash
   * @function
   * @returns {this}
   */
  getHash(){
    return window.location.hash.slice(1);
  },
  /**
   * Compiles route pattern to regular expression pattern
   * @function
   * @param {string} route - route pattern; /:?/:?
   * @returns {string} An regular expression pattern
   */
  build(route){
    return '^'+(route.replace(/\:\?/g,'([^/]+)'))+'$';
  },
  /**
   * Returns handler object if hash matches any route
   * @function
   * @param {string} hash - /test/hash/1
   * @returns {object|null} Object representing handler
   */
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
  /**
   * Sets new indow.location.hash
   * @function
   * @param {string} hash - /test/hash/1
   * @returns {this}
   */
  navigate(path) {
    window.location.hash = path;

    return this;
  },
  /**
   * Triggers handler for current window.location.hash
   * @function
   * @returns {this}
   */
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
