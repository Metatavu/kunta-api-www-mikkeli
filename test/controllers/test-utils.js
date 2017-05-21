/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const clearRequire = require('clear-require');
  const Promise = require('bluebird');
  const http = require('http');
  const webdriver = require('selenium-webdriver');
  
  process.on('unhandledRejection', (error, promise) => {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  class TestUtils {
    static startServer(configFile) {
      const app = require('kunta-api-www');
      
      return new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.listen(3000, () => {
          resolve(server);
        });
      });
    }
    
    static createDriver(browser) {
      let driver;
      driver = new webdriver.Builder()
        .forBrowser(browser)
        .build();
        
      return driver;
    }
  }
  
  module.exports = TestUtils;
  
}).call(this);