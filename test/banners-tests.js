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
  
  describe('Mocking banner requests', function () {
    this.timeout(60000);
    let runningServer;
    
    afterEach((done) => {
      runningServer.close(() => {
        clearRequire.all();
        done();
      });
    });
    
    it('Should return all banners', () => {
      const expectedResponse = require(__dirname + '/mock/responses/banners/banners.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/banners';
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
    
    it('Should return one banner based on id', () => {
      const expectedResponse = require(__dirname + '/mock/responses/banners/banners-bannerid1.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/banners/bannerid1';
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
    
    it('Should return title of one banner', () => {
      const expectedResponse = require(__dirname + '/mock/responses/banners/banners-bannerid1-title.json');
      const baseUrl = 'https://test-staging-api.kunta-api.fi/v1/organizations';
      const route = '/banners/bannerid1/title';
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

