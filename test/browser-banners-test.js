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
  
  describe('Banners tests on browser', function () {
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
    
    it('Banner sizes should be dependent of browser size ', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          driver.manage().window().setSize(1000, 1000);
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            TestUtils.getElementSizes(driver, 'div.banner-carousel-items').then((sizes) => {
              let firstSize = sizes;
              driver.manage().window().setSize(500, 1000);
              TestUtils.getElementSizes(driver, 'div.banner-carousel-items').then((sizes) => {
                if (sizes[0].width < firstSize[0].width && sizes[0].height < firstSize[0].height) {
                  resolve(0);
                } else {
                  resolve(1);
                }
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
    
    it('Banner should have title ', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('div.banner-carousel-items > div > div > div > div > h1'))
            .getText()
            .then((text) => {
              if (text === "Test title") {
                resolve(0);
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
    
    it('Banner carousel should work ', () => {
      const result = expect(new Promise((resolve, reject) => {
        let firstItem;
        
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('div.banner-carousel-items > div > div.active > div > div > h1'))
            .getText()
            .then((text) => {
              firstItem = text;
              const firstBanner = driver.findElement(webdriver.By
              .css('div.banner-carousel-items > div > div.active > div > div > h1'));
      
              driver.wait(until.elementIsNotVisible(firstBanner)).then(() => {
                TestUtils.waitAnimation(700).then(() => {
                  driver.findElement(webdriver.By
                  .css('div.banner-carousel-items > div > div.active > div > div > h1'))
                  .getText()
                  .then((text) => {
                     if (text === firstItem) {
                       resolve(1);
                     } else {
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

