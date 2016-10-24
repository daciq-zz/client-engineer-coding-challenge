'use strict';

import Ajax from './ajax.js';

const expect = chai.expect;
const testUrl = 'http://jsonplaceholder.typicode.com/posts/1';

describe('Ajax', function(){
  it( 'is an object', function(){
    expect(Ajax).to.be.an( 'object' );
  });

  it( 'has method request', function(){
    expect(Ajax.request).to.be.a( 'function' );
  });
});

describe('Ajax.request', function(){
  var fakeXHR, requests = [];

  beforeEach(function() {
    fakeXHR = sinon.useFakeXMLHttpRequest();
    requests = [];

    fakeXHR.onCreate = function (xhr) {
        requests.push(xhr);
    };
  });

  afterEach(function(){
    fakeXHR.restore();
    requests = [];
  });

  it( 'it returns FALSE if url not passed', function(){
    var request = Ajax.request();

    expect(request).to.equal(false);
  });

  it( 'it returns XMLHttpRequest object instance if url passed', function(){
    var request = Ajax.request(testUrl);

    expect(request).to.be.instanceof(XMLHttpRequest);
  });

  it( 'it sends request', function(){
    var request = Ajax.request(testUrl);

    expect(requests.length).to.equal(1);
  });

  it( 'it triggers onBeforeSend before sending request, it passess xhr as callback argument', function(done){
    var request,
        callback = sinon.spy(function(xhr){
        expect(callback).to.have.been.calledOnce;
        expect(xhr).to.be.instanceof(XMLHttpRequest);
        done();
    });

    request = Ajax.request(testUrl, {
      onBeforeSend: callback
    });
  });

  it( 'it triggers onDone callback after finished request with no errors', function(done){
    var fakeServer = sinon.fakeServer.create(),
        request,
        callback = sinon.spy(function(responseText, status, xhr){
        expect(callback).to.have.been.calledOnce;
        expect(callback).to.have.been.calledWith('OK', 200, xhr);
        done();
    });

    fakeServer.respondWith('GET', testUrl, [200, { 'Content-Type': 'text/html', 'Content-Length': 2 }, 'OK']);

    request = Ajax.request(testUrl, {
      onDone: callback
    });

    fakeServer.respond();
  });

  it( 'it triggers onFail callback if error occured', function(done){
    var fakeServer = sinon.fakeServer.create(),
        request,
        callback = sinon.spy(function(responseText, status, xhr){
        expect(callback).to.have.been.calledOnce;
        expect(callback).to.have.been.calledWith('File not found', 404, xhr);
        done();
    });

    fakeServer.respondWith('GET', testUrl, [404, {'Content-Type': 'text/plain', 'Content-Length': 14 }, 'File not found']);

    request = Ajax.request(testUrl, {
      onFail: callback
    });

    fakeServer.respond();
  });

  it( 'it triggers onAbort callback', function(){
    var request,
        callback = sinon.spy(function(xhr){
        expect(callback).to.have.been.calledOnce;
        expect(xhr).to.be.instanceof(XMLHttpRequest);
    });

    request = Ajax.request(testUrl, {
      onAbort: callback
    });

    request.abort();
  });
});
