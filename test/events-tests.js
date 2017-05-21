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
  
  describe('Mocking event requests', function () {
    this.timeout(60000);
    let app;
    
    afterEach((done) => {
      app.close(() => {
        clearRequire.all();
        done();
      });
    });
    
    it('Should return all events', () => {
      const expectedResponse = require(__dirname + '/mock/responses/events/events.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/events';
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
    
    it('Should return one event based on id', () => {
      const expectedResponse = require(__dirname + '/mock/responses/events/events-eventid1.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/events/eventid1';
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
    
    it('Should return url of one event', () => {
      const expectedResponse = require(__dirname + '/mock/responses/events/events-eventid1-originalUrl.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/events/eventid1/originalUrl';
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

