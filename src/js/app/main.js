import start from './core.js';

document.addEventListener("DOMContentLoaded", function(){
  var apiKey = document.body.dataset['apiKey'];

  start(apiKey);
});
