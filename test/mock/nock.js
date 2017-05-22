/* jshint esversion:6 */
/* global __dirname */

(function(){
  'use strict';
  
  const nock = require('nock');
  const Promise = require('bluebird');
  
  class NockController {
    static nockSettings(url, method, route) {
      const routeParts = route.split('/');
      let fileName = [];
      
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].length > 0) {
          fileName.push(routeParts[i]);
        } 
      }
      
      const filePath = __dirname + '/responses/' + routeParts[1] + '/' + fileName.join('-') + '.json';
      
      switch (method) {
        case 'GET':
          NockController.nockGet(url, route, filePath);
          break;
        case 'POST':
          NockController.nockPost(url, route,filePath);
          break;
        default:
          break;
      }
    }
    
    static nockGet(url, route, filePath) {
      const mock = nock(url)
        .get(route)
        .replyWithFile(200, filePath);
    }
    
    static nockPost(url, route ,responsePath) {
      const response = require(responsePath);
      const mock = nock(url)
        .post(route, {
          message: "test"
        })
        .replyWithFile(200, responsePath);
    }
  }
  
  module.exports = NockController;
  
}).call(this);