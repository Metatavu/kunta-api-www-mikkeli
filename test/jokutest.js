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
  const browser = 'chrome';
  
  chai.use(require('chai-as-promised'));
  
  describe('Testing search bar', function () {
    this.timeout(60000);
    let app;
    let driver;
    
    afterEach((done) => {
      app.close(() => {
        clearRequire.all();
        done();
      });
    });
    
    it('Should return all tiles', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          app = server;
          
          driver = TestUtils.createDriver(browser);
          driver.get('http://localhost:3000');
          
          driver.wait(until.titleIs("asd")).then(() => {
            resolve("asd");
          });
        });
      }));
      
      return result
        .to
        .eventually
        .eql("expectedResponse");
    });
  });
})();

