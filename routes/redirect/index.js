/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const Common = require(__dirname + '/../common');

  module.exports = (app, config, ModulesClass) => {

    app.get('/redirect/:type/:id', (req, res, next) => {
      var type = req.params.type;
      var id = req.params.id;
      
      switch (type) {
        case 'page':
          new ModulesClass(config)
            .pages.resolvePath(id)
            .callback((data) => {
              if (data) {
                if (Array.isArray(data) && data[0]) {
                  res.redirect(util.format("%s/%s", Common.CONTENT_FOLDER, data[0]));  
                } else {
                  res.redirect(util.format("%s/%s", Common.CONTENT_FOLDER, data.toString()));  
                }
              } else {
                res.redirect('/');
              }
            });
        break;
        case 'file':
          res.redirect(util.format("%s/%s", Common.FILES_FOLDER, id));
        break;
        default:
          next({
            status: 400,
            message: 'Invalid type'
          });
        break;
      }
    });
    
  };

}).call(this);