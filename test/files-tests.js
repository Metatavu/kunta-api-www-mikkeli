/* jshint esversion:6 */
/* global __dirname */

(function() {
  'use strict';
  
  const clearRequire = require('clear-require');
  const config = require('nconf');
  const chai = require('chai');
  const expect = chai.expect;
  const webdriver = require('selenium-webdriver');
  const By = webdriver.By;
  const until = webdriver.until;
  const Promise = require('bluebird');
  const TestUtils = require(__dirname + '/controllers/test-utils');
  const NockController = require(__dirname + '/mock/nock.js');
  const request = require('request');
  
  chai.use(require('chai-as-promised'));
  
  describe('Mocking file requests', function () {
    this.timeout(60000);
    let app;
    
    afterEach((done) => {
      app.close(() => {
        clearRequire.all();
        done();
      });
    });
    
    it('Should return all file', () => {
      const expectedResponse = require(__dirname + '/mock/responses/files/files.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/files';
      const httpMethod = 'GET';
      
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          app = server;
          NockController.nockSettings(baseUrl, httpMethod, route);
      
          request.get(baseUrl + route, ((err, res, body) => {
            resolve(JSON.parse(body));
          }));
        });
      }));
      
      return result
        .to
        .eventually
        .eql(expectedResponse);
    });
    
    it('Should return one file based on id', () => {
      const expectedResponse = require(__dirname + '/mock/responses/files/files-fileid1.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/files/fileid1';
      const httpMethod = 'GET';
      
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          app = server;
          NockController.nockSettings(baseUrl, httpMethod, route);
      
          request.get(baseUrl + route, ((err, res, body) => {
            resolve(JSON.parse(body));
          }));
        });
      }));
      
      return result
        .to
        .eventually
        .eql(expectedResponse);
    });
    
    it('Should return title of one file', () => {
      const expectedResponse = require(__dirname + '/mock/responses/files/files-fileid1-title.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/files/fileid1/title';
      const httpMethod = 'GET';
      
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          app = server;
          NockController.nockSettings(baseUrl, httpMethod, route);
      
          request.get(baseUrl + route, ((err, res, body) => {
            resolve(JSON.parse(body));
          }));
        });
      }));
      
      return result
        .to
        .eventually
        .eql(expectedResponse);
    });
  });
})();

