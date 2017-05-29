/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const clearRequire = require('clear-require');
  const Promise = require('bluebird');
  const http = require('http');
  const path = require('path');
  const express = require('express');
  const webdriver = require('selenium-webdriver');
  const NockController = require(__dirname + '/../mock/nock.js');
  
  class TestUtils {
    static startServer(configFile) {
      const config = require('nconf');
      config.file({ file: __dirname + '/../config/config.json' });
      const app = require('../../node_modules/kunta-api-www/index')(config);
      
      return new Promise((resolve, reject) => {
        const server = app.listen(3000, () => {
          resolve(server);
        });
      });
    }
    
    static createDriver(browser) {
      let driver;
      
      if (browser === 'chrome') {
        let capabilities = webdriver.Capabilities.chrome();
        let chromeOptions = {
          'args': [
            '--disable-gpu',
            '--disable-impl-side-painting',
            '--disable-gpu-sandbox',
            '--disable-accelerated-2d-canvas',
            '--disable-accelerated-jpeg-decoding',
            '--no-sandbox',
            '--test-type=ui'
          ]
        };
        capabilities.set('chromeOptions', chromeOptions);
        
        driver = new webdriver.Builder()
          .forBrowser(browser)
          .withCapabilities(capabilities)
          .build();
      } else {
        driver = new webdriver.Builder()
          .forBrowser(browser)
          .build();
      }
      return driver;
    }
  
    static getElementSizes(driver, locateType, locateWord) {
      return new Promise((resolve, reject) => {
        driver.executeScript(
          function (locateWord, locateType) {
            switch (locateType) {
              case 'class':
                var elements = document.getElementsByClassName(locateWord);
                return multipleElements(elements);
                break;
              case 'css':
                var elements = document.querySelectorAll(locateWord);
                return multipleElements(elements);
                break;
              case 'id':
                var elements = document.getElementById(locateWord);
                return oneElement(elements);
                break;
              default:
                break;
            };

            function multipleElements(elements) {
              var elementSizes = [];
              
              for (var i = 0; i < elements.length; i++) {
                var sizes = {
                  'width': elements[i].offsetWidth,
                  'height': elements[i].offsetHeight
                };

                elementSizes.push(sizes);
              };
              return elementSizes;
            };
          
            function oneElement(element) {
              var sizes = {
                'width': element.offsetWidth,
                'height': element.offsetHeight
              };
              return sizes;
            };

          },
          locateWord, locateType
        ).then(function (obj) {
           resolve(obj);
        });
      });
    }
  }
  
  module.exports = TestUtils;
  
}).call(this);