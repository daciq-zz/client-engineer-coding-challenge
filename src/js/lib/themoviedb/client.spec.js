'use strict';

import TheMovieDb from './client.js';
const expect = chai.expect;

const testKey = 'dc57e04a66ee0aa0b526c711f1c456e1';

describe('TheMovieDb', function(){
  it( 'is an class', function(){
    expect(TheMovieDb).to.be.a( 'function' );
  });

  it( 'it creates TheMovieDb object', function(){
    var obj = new TheMovieDb(testKey);

    expect(obj).to.be.a( 'object' );
    expect(obj).to.be.instanceof(TheMovieDb);
  });
});

describe('TheMovieDb.prepareQuery', function(){
  it( 'it returns query string including api_key', function(){
    var obj = new TheMovieDb(testKey),
        query = obj.prepareQuery({
          'param1': 'value1',
          'param2': 'value2'
        });

    expect(query).to.equal('api_key='+testKey+'&param1=value1&param2=value2');
  })
});

describe('TheMovieDb.prepareCommand', function(){
  it( 'it coverts array to api command', function(){
    var obj = new TheMovieDb(testKey),
        command = obj.prepareCommand([
          'search', 'collection'
        ]);

    expect(command).to.equal('search/collection');
  })

  it( 'it removes empty elements', function(){
    var obj = new TheMovieDb(testKey),
        command = obj.prepareCommand([
          '', 'search', null, 'collection', ''
        ]);

    expect(command).to.equal('search/collection');
  })
});

describe('TheMovieDb.getConfiguration', function(){
  it( 'returns configuration object', function(done){
      var client = new TheMovieDb(testKey);

      client.getConfiguration(
        function(data){
          expect(data).to.be.an('object');
          expect(data).to.have.property('images');
          done();
        }
      );
  });
});

describe('TheMovieDb.search', function(){
  it( 'it calls done function on success', function(done){
      var client = new TheMovieDb(testKey);

      client.search({
        query: 'Westworld'
      },
      function(data){
        expect(data).to.be.a('object');
        expect(data).to.have.property('results');
        done();
      });
  });
});

describe('TheMovieDb.search', function(){
  it( 'search movie', function(done){
      var client = new TheMovieDb(testKey);

      client.search({
        query: 'Westworld'
      },
      function(data){
        expect(data).to.be.a('object');
        expect(data).to.have.property('results');
        done();
      });
  });
});
