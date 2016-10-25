'use strict';

import Router from './router.js';

const expect = chai.expect;

describe('Router', function(){
  it( 'is an object', function(){
    expect(Router).to.be.an( 'object' );
  });
});


describe('Router.getHash', function(){
  var hash = '/movie/12';

  before(function(){
    window.location.hash = '/movie/12';
  });

  after(function(){
    window.location.hash = '';
  });

  it( 'it return current window hash', function(){
    expect(Router.getHash()).to.equal(hash);
  });
});

describe('Router.add.remove.flush', function(){
  before(function(){
    Router.flush();
  });

  after(function(){
    Router.flush();
  });

  it( 'it adds routes', function(){
    Router.add('/test/route', function(){});

    expect(Router.getRoutes()).to.have.property('/test/route')
  });

  it( 'it removes routes', function(){
    Router.remove('/test/route');

    expect(Router.getRoutes()).not.to.have.property('/test/route')
  });

  it( 'it flushes routes', function(){
    Router.add('/test/route', function(){});
    Router.flush();

    expect(Router.getRoutes()).to.deep.equal({});
  });

});

describe('Router.build', function(){

  it( 'it returns regexp pattern to match hash', function(){
    expect(Router.build('/movie/:?')).to.equal('^\/movie\/([^/]+)$');
  });
});

describe('Router.search', function(){
  before(function(){
    Router.flush();
  });

  after(function(){
    Router.flush();
  });

  it( 'it returns handler that matches hash', function(){
    var callback = function(){}, handler;

    Router.add('/test/route', callback);
    Router.add('/movie', callback);
    Router.add('/movie/:?', callback);

    handler = Router.search('/movie/12');

    expect(handler).to.deep.equal({
      route: '/movie/:?',
      pattern: '^/movie/([^/]+)$',
      params: ['12'],
      callback: callback
    });

    handler = Router.search('/movie');

    expect(handler).to.deep.equal({
      route: '/movie',
      pattern: '^/movie$',
      params: [],
      callback: callback
    });

  });
});

describe('Router.listen', function(){
  before(function(){
    Router.flush();
  });

  after(function(){
    Router.flush();
    window.location.hash = '';
  });

  it( 'it starts listening hashchange event and calls route handler on hashchange', function(){
    var callback1 = sinon.spy(function(){}),
        callback2 = sinon.spy(function(){
          expect(callback1).not.to.have.been.calledOnce;
          expect(callback2).to.have.been.calledOnce;
          expect(callback2).to.have.been.calledWith('45');
        });

    Router.add('/test/route', callback1);
    Router.add('/movie/:?', callback2);
    Router.listen();

    window.location.hash = '/movie/45';

    Router.stop();
  });
});
