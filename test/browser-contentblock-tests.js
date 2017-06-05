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
  
  describe('Content box tests(info,jobs,announcements) browser', function () {
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
    
    it('Content-block content should exists and fit inside', () => {
      const result = expect(new Promise((resolve, reject) => {
        let resolveValue = 0;
        
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.className('content-block'))).then(() => {
            TestUtils.getElementSizes(driver, 'div.content-block').then((sizes) => {
              const blockSizes = sizes;
              TestUtils.getElementSizes(driver, 'div.content-block-row').then((sizes) => {
                const rowSizes = sizes;
                for (let i = 0; i < blockSizes.length; i++) {
                  for (let j = 0; j < rowSizes.length; j++) {
                    if (rowSizes[j].width > (blockSizes[i].width - 30)) {
                      resolve(1);
                      break;
                    }  
                  }
                }
                driver.findElement(webdriver.By
                .css('.content-blocks-container > .container > .row > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(1)'))
                .getText()
                .then((elements) => {
                  if (elements.toUpperCase().includes("PROGRAMMING JOB")) {
                    driver.findElement(webdriver.By
                    .css('.content-blocks-container > .container > .row > div:nth-of-type(2) > div > div:nth-of-type(3) > div:nth-of-type(2)'))
                    .getText()
                    .then((elements) => {
                      if (elements.toUpperCase().includes("CLEANING JOB")) {
                        driver.findElement(webdriver.By
                        .css('.content-blocks-container > .container > .row > div:nth-of-type(3) > div > div:nth-of-type(3) > div:nth-of-type(1)'))
                        .getText()
                        .then((elements) => {
                          if (elements.toUpperCase().includes("TITLE1")) {
                            driver.findElement(webdriver.By
                            .css('.content-blocks-container > .container > .row > div:nth-of-type(3) > div > div:nth-of-type(3) > div:nth-of-type(2)'))
                            .getText()
                            .then((elements) => {
                              if (elements.toUpperCase().includes("TITLE2")) {
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

