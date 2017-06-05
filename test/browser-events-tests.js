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
  
  describe('Events tests on browser', function () {
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
    
    it('Event carousel should work ', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          let firstText;
          
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('div.events-container > div:nth-of-type(1) > div:nth-of-type(1) > .swiper-slide-active'))
            .getText()
            .then((text) => {
              firstText = text;
              const firstEvent = driver.findElement(webdriver.By
              .css('div.events-container > div:nth-of-type(1) > div:nth-of-type(1) > .swiper-slide-active'));
              
              driver.wait(until.elementIsNotVisible(firstEvent)).then(() => {
                driver.findElement(webdriver.By
                .css('div.events-container > div:nth-of-type(1) > div:nth-of-type(1) > .swiper-slide-active'))
                .getText()
                .then((text) => {
                  if(text === firstText) {
                    resolve(1);
                  } else {
                    resolve(0);
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
    
    it('Event link should work', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          let firstText;
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            driver.findElement(webdriver.By
            .css('div.events-container > div:nth-of-type(1) > div:nth-of-type(1) > .swiper-slide-active'))
            .then((element) => {
              element.click();
              driver.getAllWindowHandles().then((allhandles) => {
                driver.switchTo().window(allhandles[allhandles.length - 1]);
                driver.wait(until.titleIs('Example Domain')).then(() => {
                  resolve(0);
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
    
    it('Event pictures should work', () => {
      const result = expect(new Promise((resolve, reject) => {
        TestUtils.startServer().then((server) => {
          runningServer = server;
          let firstText;
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.css('body'))).then(() => {
            TestUtils.waitAnimation(3000).then(() => {
              driver.findElement(webdriver.By
              .css('div.events-container > div:nth-of-type(1) > div:nth-of-type(1) > .swiper-slide-active > div:nth-of-type(1) > div:nth-of-type(1)'))
              .then((element) => {
                element.getAttribute('lazy-bg-image').then((lazybg) => {
                  if (!lazybg) {
                    element.getAttribute('style').then((style) => {
                      if (style.includes('background-image:')) {
                        resolve(0);
                      } else {
                        resolve(1);
                      }
                    });
                  } else {
                    function waitLazyBg() {
                      setTimeOut(() => {
                        element.getAttribute('style').then((style) => {
                          if (style.includes('background-image:')) {
                            resolve(0);
                          } else {
                            waitLazyBg();
                          }
                        });
                      }, 1000);
                    };
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

