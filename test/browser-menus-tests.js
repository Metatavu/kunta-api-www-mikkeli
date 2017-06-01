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
  
  describe('Menus tests on browser-menus', function () {
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
    
    it('Menus should have total of 4 links', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('.navbar-toggleable-xs > nav > div:nth-of-type(1) > ul > li:nth-of-type(1)'))
            .getText()
            .then((element) => {
              if (element.toUpperCase() === 'FOO') {
                driver.findElement(webdriver.By
                .css('.navbar-toggleable-xs > nav > div:nth-of-type(1) > ul > li:nth-of-type(2)'))
                .getText()
                .then((element) => {
                  if (element.toUpperCase() === 'BAR') {
                    driver.findElement(webdriver.By
                    .css('.navbar-toggleable-xs > nav > div:nth-of-type(2) > ul > li:nth-of-type(1)'))
                    .getText()
                    .then((element) => {
                      if (element.toUpperCase() === 'FOO') {
                        driver.findElement(webdriver.By
                        .css('.navbar-toggleable-xs > nav > div:nth-of-type(2) > ul > li:nth-of-type(2)'))
                        .getText()
                        .then((element) => {
                          if (element.toUpperCase() === 'BAR') {
                            resolve(0);
                          } else {
                            resolve(1);
                          }
                        });
                      } else {
                        resolve(1);
                      }
                    });
                  } else {
                    resolve(1);
                  }
                });
              } else {
                resolve(1);
              }
            });
          });
        });
      }));
      
      return result
        .to
        .eventually
        .eql(0);
    });
    
    it('FOO links should direct to google.com', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('.navbar-toggleable-xs > nav > div:nth-of-type(1) > ul > li:nth-of-type(1)'))
            .then((element) => {
              element.click();
              driver.wait(until.titleIs('Google')).then(() => {
                driver.get('http://localhost:3000');
                driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
                  driver.findElement(webdriver.By
                  .css('.navbar-toggleable-xs > nav > div:nth-of-type(2) > ul > li:nth-of-type(1)'))
                  .then((element) => {
                    element.click();
                    driver.wait(until.titleIs('Google')).then(() => {
                      resolve(0);
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
    
    it('BAR links should direct to example.com', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('.navbar-toggleable-xs > nav > div:nth-of-type(1) > ul > li:nth-of-type(2)'))
            .then((element) => {
              element.click();
              driver.wait(until.titleIs('Example Domain')).then(() => {
                driver.get('http://localhost:3000');
                driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
                  driver.findElement(webdriver.By
                  .css('.navbar-toggleable-xs > nav > div:nth-of-type(2) > ul > li:nth-of-type(2)'))
                  .then((element) => {
                    element.click();
                    driver.wait(until.titleIs('Example Domain')).then(() => {
                      resolve(0);
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
  });
})();

