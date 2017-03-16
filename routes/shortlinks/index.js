/*jshint esversion: 6 */
(function() {
  'use strict';
  
  const UPDATE_INTERVAL = 1000 * 60;

  class ShortlinksHandler {

    constructor(config, ModulesClass) {
      this.config = config;
      this.ModulesClass = ModulesClass;
      this.shortlinks = {};
      this.updateShortlinks();
    }

    updateShortlinks() {
      var modules = new this.ModulesClass(this.config);

      modules
        .shortlinks.list()
        .callback((data) => {
          this.refreshShortlinks(data[0]);
          setTimeout(() => {
            this.updateShortlinks();
          }, UPDATE_INTERVAL);
        });
    }
    
    refreshShortlinks(shortlinks) {
      var map = {};
      
      shortlinks.forEach((shortlink) => {
        map[shortlink.path] = shortlink.url;
      });

      this.shortlinks = map;
    }
    
    getUrl (path) {
      return this.shortlinks[path];
    }
    
  }
  
  module.exports = (app, config, ModulesClass) => {
    var handler = new ShortlinksHandler(config, ModulesClass);
    
    app.use((req, res, next) => {
      var url = handler.getUrl(req.path);
      if (url) {
        res.redirect(url);
      } else {
        next();
      }
    });
    
  };

}).call(this);