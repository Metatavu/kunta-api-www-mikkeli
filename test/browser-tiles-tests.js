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
  const browser = process.env.KUNTA_API_BROWSER || 'phantomjs';
  const cloudinary = require('cloudinary');
  
  cloudinary.config({ 
    cloud_name: 'dt5oy4f4h', 
    api_key: '618253323254538', 
    api_secret: 'YqBdi-Y2quKdpkhOfKjbEm7abw0' 
  });
  
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
          driver.manage().window().setSize(1600, 900);
          
          driver.wait(until.elementLocated(webdriver.By.className('tile'))).then(() => {
            driver.findElements(webdriver.By.className('tile')).then((elements) => {
              TestUtils.getElementSizes(driver, 'class', 'tile').then((sizes) => {
                const tileSizes = sizes;
                TestUtils.getElementSizes(driver, 'class', 'bigtext-line0').then((sizes) => {
                  const headerSizes = sizes;
                  
                  for (let i = 0; i < headerSizes.length; i++) {
                    if (headerSizes[i].width > (tileSizes[i].width - 32)) {
                      resolveValue += "aa1";
                      break;
                    } 
                  }
                  
                  TestUtils.getElementSizes(driver, 'css', 'div.tile > div.details').then((sizes) => {
                    const detailSizes = sizes;
                    TestUtils.getElementSizes(driver, 'class', 'tile-text').then((sizes) => {
                      const tileTextSizes = sizes;
                      for (let i = 0; i < detailSizes.length; i++) {
                        if (tileTextSizes[i].height > (detailSizes[i].height - 30 - headerSizes[i].height)) {
                          resolveValue += "aa2";
                        }
                        
                        if (tileTextSizes[i].width > (detailSizes[i].width - 32)) {
                          resolveValue += "aa3";
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

