/*jshint esversion: 6 */
/* global __dirname, process */

(function() {
  'use strict';
  
  const SauceLabs = require('saucelabs');
  const Promise = require('bluebird');
  const webdriver = require('selenium-webdriver');
  
  class SauceController { 
    constructor() {
    }
    
    initSauce(testname) {
      const browser = process.env.BROWSER;
      const version = process.env.VERSION;
      const platform = process.env.PLATFORM;
      const username = process.env.SAUCE_USERNAME;
      const accessKey = process.env.SAUCE_ACCESS_KEY;
      const server = "http://" + username + ":" + accessKey + "@ondemand.saucelabs.com:80/wd/hub";
      const tunnelId = process.env.TRAVIS_JOB_NUMBER;

      if (!username || !accessKey){
        console.log("Saucelabs username or key missing");
        process.exit(1);
      }

      this.saucelabs = new SauceLabs({
        username: username,
        password: accessKey
      });

      let desiredCaps = {
        'browserName': browser,
        'platform': platform,
        'version': version,
        'username': username,
        'accessKey': accessKey,
        'name': testname,
        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER
      };

      this.driver = new webdriver.Builder().
      withCapabilities(desiredCaps).
      usingServer(server).
      build();

      this.driver.getSession().then((sessionid) => {
        this.driver.sessionID = sessionid.id_;
      });

      return this.driver;
    }
    
    updateJobState(passed, callback) {
      this.saucelabs.updateJob(this.driver.sessionID, {
        passed: passed
      }, callback);
    }
  }
  
  module.exports = SauceController;
}).call(this);