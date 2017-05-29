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
  const browser = process.env.KUNTA_API_BROWSER || 'chrome';
  
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
    
    it('Tile text and header should fit in tile box', () => {
      const result = expect(new Promise((resolve, reject) => {
        let resolveValue = 0;
        
        TestUtils.startServer().then((server) => {
          runningServer = server;
          
          driver = TestUtils.createDriver(browser);
          driver.manage().timeouts().setScriptTimeout(60000);
          driver.get('http://localhost:3000');
          
          driver.wait(until.elementLocated(webdriver.By.className('tile'))).then(() => {
            driver.findElements(webdriver.By.className('tile')).then((elements) => {
              TestUtils.getElementSizes(driver, 'class', 'tile').then((sizes) => {
                const tileSizes = sizes;
                TestUtils.getElementSizes(driver, 'class', 'bigtext-line0').then((sizes) => {
                  const headerSizes = sizes;
                  
                  for (let i = 0; i < headerSizes.length; i++) {
                    if (headerSizes[i].width > (tileSizes[i].width - 32)) {
                      resolveValue = 1;
                      break;
                    } 
                  }
                  
                  TestUtils.getElementSizes(driver, 'css', 'div.tile > div.details').then((sizes) => {
                    const detailSizes = sizes;
                    TestUtils.getElementSizes(driver, 'class', 'tile-text').then((sizes) => {
                      const tileTextSizes = sizes;
                      for (let i = 0; i < detailSizes.length; i++) {
                        if (tileTextSizes[i].height > (detailSizes[i].height - 30 - headerSizes[i].height)) {
                          resolveValue = 1;
                        }
                        
                        if (tileTextSizes[i].width > (detailSizes[i].width - 32)) {
                          resolveValue = 1;
                        }
                      }
                      resolve(resolveValue);
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

