/* jshint esversion:6 */
/* global __dirname */

(function() {
  'use strict';
  
  const clearRequire = require('clear-require');
  const config = require('nconf');
  const chai = require('chai');
  const util = require('util');
  const expect = chai.expect;
  const webdriver = require('selenium-webdriver');
  const By = webdriver.By;
  const until = webdriver.until;
  const Promise = require('bluebird');
  const TestUtils = require(__dirname + '/controllers/test-utils');
  const NockController = require(__dirname + '/mock/nock.js');
  const request = require('request');
  
  chai.use(require('chai-as-promised'));
  
  describe('Mocking fragment requests', function () {
    this.timeout(60000);
    let runningServer;
    
    afterEach((done) => {
      runningServer.close(() => {
        clearRequire.all();
        done();
      });
    });
    
    it('Should return all fragments', () => {
      const expectedResponse = require(__dirname + '/mock/responses/fragments/fragments.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/fragments';
      const httpMethod = 'GET';
      
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          NockController.nockSettings(baseUrl, httpMethod, route);
      
          request.get(util.format('%s%s', baseUrl, route), ((err, res, body) => {
            resolve(JSON.parse(body));
          }));
        });
      }));
      
      return result
        .to
        .eventually
        .eql(expectedResponse);
    });
    
    it('Should return one fragment based on id', () => {
      const expectedResponse = require(__dirname + '/mock/responses/fragments/fragments-fragmentid1.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/fragments/fragmentid1';
      const httpMethod = 'GET';
      
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          NockController.nockSettings(baseUrl, httpMethod, route);
      
          request.get(util.format('%s%s', baseUrl, route), ((err, res, body) => {
            resolve(JSON.parse(body));
          }));
        });
      }));
      
      return result
        .to
        .eventually
        .eql(expectedResponse);
    });
    
    it('Should return id of one fragment', () => {
      const expectedResponse = require(__dirname + '/mock/responses/fragments/fragments-fragmentid1-id.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/fragments/fragmentid1/id';
      const httpMethod = 'GET';
      
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          NockController.nockSettings(baseUrl, httpMethod, route);
      
          request.get(util.format('%s%s', baseUrl, route), ((err, res, body) => {
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

