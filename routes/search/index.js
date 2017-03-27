/*jshint esversion: 6 */
(function() {
  'use strict';

  module.exports = (app, config, ModulesClass) => {

    app.get('/ajax/search', (req, res) => {
      var search = req.query.search;
      var preferLanguages = req.headers['accept-language'];
      
      new ModulesClass(config)
        .pages.search(search, preferLanguages)
        .files.search(search, preferLanguages)
        .callback(function(data) {
          var pages = data[0];
          var files = data[1];
          
          res.render('ajax/search.pug', {
            pages: pages,
            files: files
          });
        });
    });
    
  };

}).call(this);