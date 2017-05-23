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
  
  describe('Mocking news article requests', function () {
    
    before(() => {
      NockController.getShortlinks();
    });
    
    this.timeout(60000);
    
    it('Should return all news', () => {
      const expectedResponse = require(__dirname + '/mock/responses/news/news.json');
      const baseUrl = 'https://staging-api.kunta-api.fi/v1/organizations';
      const route = '/news';
      const httpMethod = 'GET';
      
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer('../config/config.json').then(() => {
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

