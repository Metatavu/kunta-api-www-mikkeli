/* jshint esversion:6 */
/* global __dirname */

(function(){
  'use strict';
  
  const nock = require('nock');
  const Promise = require('bluebird');
  const util = require('util');
  const fs = require('fs');
  
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
          NockController.nockPost(url, route, filePath);
          break;
        default:
          break;
      }
    }
    
    static nockEverything() {
      const allRoutes = require(__dirname + '/../data/all-routes.json');
      let fileNames = [];
      
      for (let i = 0; i < allRoutes.length; i++) {
        fileNames.push(allRoutes[i].route.split('/').join('-'));
      }
      
      for (let i = 0; i < fileNames.length; i++) {
        let header;
        let body;
        let response;
        
        if(allRoutes[i].content) {
          header = {
            'Content-Type': allRoutes[i].content
          };
        } else {
          header = {
            'header': 'test'
          };
        }
        
        if(allRoutes[i].content === 'image/jpeg') {
          response = fs.readFileSync(__dirname + allRoutes[i].response);
        } 
        else if (allRoutes[i].content === 'text/html') {
          fs.exists(__dirname + allRoutes[i].response, function(fileok){
            if (fileok) {
              fs.readFile(__dirname + allRoutes[i].response, function(error, data) {
                response = data;
              });
            } else {
              console.log("file not found");
            }
          });
        } else {
          response = require(__dirname + allRoutes[i].response);
        }

        nock('https://test-api.kunta-api.fi/v1/organizations/testId')
          .get('/' + allRoutes[i].route)
          .times(25)
          .query(allRoutes[i].query)
          .reply(200, response, header); 
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