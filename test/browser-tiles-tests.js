/* jshint esversion:6 */
/* global __dirname, process*/

(function() {
  'use strict';
  
  const clearRequire = require('clear-require');
  const config = require('nconf');
  const chai = require('chai');
  const util = require('util');
  const expect = chai.expect;
  const webdriver = require('selenium-webdriver');
  const By = webdriver.By;
  const nock = require('nock');
  const until = webdriver.until;
  const Promise = require('bluebird');
  const TestUtils = require(__dirname + '/controllers/test-utils');
  const NockController = require(__dirname + '/mock/nock.js');
  const request = require('request');
  const browser = process.env.KUNTA_API_BROWSER || 'firefox';
  
  chai.use(require('chai-as-promised'));
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  describe('Tiles tests in browser', function () {
    this.timeout(60000);
    let runningServer;
    let driver;
    
    before((done) => {
      NockController.nockEverything();
      done();
    });
    
    afterEach((done) => {
      if (driver) {
        driver.close();
        driver = null;
      }
      
      runningServer.close(() => {
        clearRequire.all();
        done();
      });
    });
    
    it('Should find all (1) tiles', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver = TestUtils.createDriver(browser);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.className('tile'))).then(() => {
            resolve(1);
          });
        });
      }));
      
      return result
        .to
        .eventually
        .eql(1);
    });
  });
})();

