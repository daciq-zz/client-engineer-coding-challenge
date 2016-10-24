'use strict';

import Utils from './utils.js';

describe('Utils', function(){
  it( 'is an object', function(){
    expect(Utils).to.be.an( 'object' );
  });
});

describe('Utils.query', function(){
  it( 'it is a function', function(){
    expect(Utils.query).to.be.an( 'function' );
  });

  it( 'it returns query string when object is passed as parameter', function(){
    expect(Utils.query({
      'param1': 'value1',
      'param2': 'value2'
    })).to.equal( 'param1=value1&param2=value2' );
  });

  it( 'it returns empty string when empty object is passed as parameter', function(){
    expect(Utils.query({})).to.equal( '' );
  });
});

describe('Utils.template', function(){
  it( 'it is a function', function(){
    expect(Utils.template).to.be.an( 'function' );
  });

  it( 'it returns function', function(){
    expect(Utils.template()).to.be.an( 'function' );
  });

  it( 'it builds html based on string template', function(){
    var template = Utils.template('<div><% prop1 %></div><span><% prop2 %></span>');

    expect(template(
      {
        'prop1': 'value1',
        'prop2': 10
      }
    )).to.equal( '<div>value1</div><span>10</span>' );
  });
});
