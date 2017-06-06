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
  const SauceController = require(__dirname + '/controllers/saucelabs.js');
  const request = require('request');
  const browser = process.env.KUNTA_API_BROWSER || 'chrome';
  
  chai.use(require('chai-as-promised'));
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  describe('Search tests on browser-search', function () {
    this.timeout(60000);
    let runningServer;
    let sauceController;
    let driver;
    
    beforeEach(function(done) {
      NockController.nockEverything();
      
      if (!process.env.LOCAL_TESTS) {
        sauceController = new SauceController();
        driver = sauceController.initSauce(this.title);
      } else {
        driver = TestUtils.createDriver(browser);
      }
      done();
    });
    
    afterEach(function(done) {
      if (!process.env.LOCAL_TESTS) {
        const passed = this.currentTest.state === 'failed' ? false : true;
        sauceController.updateJobState(passed,() => {
          driver.quit();
          driver = null;
          runningServer.close();
          clearRequire.all();
          done();
        });
      } else {
        driver.quit();
        driver = null;
        runningServer.close();
        clearRequire.all();
        done();
      }
    });
    
    it('Search submit should find news', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('.nav-search-container > input'))
            .then((element) => {
              element.sendKeys('foo').then(() => {
                element.sendKeys(webdriver.Key.ENTER);
                
                driver.wait(until.elementLocated(webdriver.By
                .linkText('Uutiset')))
                .then((element) => {
                  element.click().then(() => {
                    driver.wait(until.elementLocated(webdriver.By.css('div.search-result'))).then(() => {
                      driver.findElements(webdriver.By.css('div.search-result')).then((elements) => {
                        elements[1].getText().then((text) => {
                          if (text.includes('This should be on page 1')) {
                            resolve(0);
                          } else {
                            resolve(1);
                          }
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }));
      
      return result
        .to
        .eventually
        .eql(0);
    });
    
    it('Should find news without submit', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('.nav-search-container > input'))
            .then((element) => {
              element.sendKeys('foo').then(() => {
                driver.wait(until.elementLocated(webdriver.By.css('div.search-results'))).then(() => {
                  driver.findElements(webdriver.By
                  .css('.search-results > ul > li'))
                  .then((elements) => {
                    if (elements.length === 14) {
                      resolve(0);
                    }
                  });
                });
              });
            });
          });
        });
      }));
      
      return result
        .to
        .eventually
        .eql(0);
    });
  });
})();

