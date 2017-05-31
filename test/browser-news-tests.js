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
  
  describe('News tests in browser', function () {
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
    
    it('News title should fit in news box', () => {
      const result = expect(new Promise((resolve, reject) => {
        let resolveValue = 0;
        
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.className('news-article'))).then(() => {
            driver.findElements(webdriver.By.className('top-article')).then(() => {
              TestUtils.getElementSizes(driver, 'div.news-article:not(.text-article)').then((sizes) => {
                const newsSizes = sizes;
                TestUtils.getElementSizes(driver, 'div.news-article > div.details > .title').then((sizes) => {
                  const titleSizes = sizes;
                  for (let i = 0; i < titleSizes.length; i++) {
                    if (titleSizes[i].width > (newsSizes[i].width - 48)) {
                      resolveValue = 1;
                      break;
                    }
                  }
                  resolve(resolveValue);
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
    
    it('News title should fit in text-article box', () => {
      const result = expect(new Promise((resolve, reject) => {
        let resolveValue = 0;
        
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.className('news-article'))).then(() => {
            driver.findElements(webdriver.By.className('text-article')).then(() => {
              TestUtils.getElementSizes(driver, 'div.text-article').then((sizes) => {
                const newsSizes = sizes;
                TestUtils.getElementSizes(driver, 'div.text-article > .title').then((sizes) => {
                  const titleSizes = sizes;
                  for (let i = 0; i < titleSizes.length; i++) {
                    if (titleSizes[i].width > (newsSizes[i].width - 48)) {
                      resolveValue = 1;
                      break;
                    }
                  }
                  resolve(resolveValue);
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
    
    
    it('Clicking show all news should change url', () => {
      const result = expect(new Promise((resolve, reject) => {
        let resolveValue = 0;
        
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.className('all-news-link'))).then((element) => {
            element.click();
            driver.wait(until.elementLocated(webdriver.By.className('row'))).then(() => {
              resolve(driver.getCurrentUrl());
            });
          });
        });
      }));
      
      return result
        .to
        .eventually
        .eql('http://localhost:3000/uutiset/');
    });
    
    it('Pagination links should change page', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000/uutiset/');
          
          driver.wait(until.elementLocated(webdriver.By.className('title'))).then(() => {
            driver.wait(until.elementLocated(webdriver.By.linkText('Seuraava sivu'))).then((element) => {
              element.click();
              driver.wait(until.elementLocated(webdriver.By.className('title'))).then(() => {
                driver.wait(until.elementLocated(webdriver.By.linkText('Edellinen sivu'))).then((element) => {
                  element.click();
                  driver.wait(until.elementLocated(webdriver.By.className('title'))).then(() => {
                    resolve(driver.getCurrentUrl());
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
        .eql('http://localhost:3000/uutiset/?page=0');
    });
  });
})();

