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
  
    static getElementSizes(driver, selector) {
      return new Promise((resolve, reject) => {
        driver.executeScript(
          function (selector) {
            var elements = document.querySelectorAll(selector);
            var allSizes = kala(elements);
            
            function kala(elements) {
              var elementSizes = [];
              for (var i = 0; i < elements.length; i++) {
                elementSizes.push({
                  'width': elements[i].offsetWidth,
                  'height': elements[i].offsetHeight
                });
              };
              return elementSizes;
            };
            return allSizes;
          },
          selector
        ).then(function (obj) {
           resolve(obj);
        });
      });
    }
  }
  
  module.exports = TestUtils;
  
}).call(this);