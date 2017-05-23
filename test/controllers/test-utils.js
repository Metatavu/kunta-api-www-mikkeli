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
  
  process.on('unhandledRejection', (error, promise) => {
    console.error("UNHANDLED REJECTION", error.stack);
  });
  
  class TestUtils {
    static startServer(configFile) {
      const config = require('nconf');
      config.file({ file: __dirname + '/../config/config.json' });
      const app = require('../../node_modules/kunta-api-www/index');
      const Modules = require('../../node_modules/kunta-api-www/modules');
      const implementation = require('../../index')();

      app.set('views',implementation.views);
      app.use(express.static(implementation.static));
      app.use(express.static(path.join(__dirname, 'public')));
      implementation.routes(app, config, Modules);
      
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