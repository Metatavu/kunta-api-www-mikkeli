/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const Common = require(__dirname + '/common');

  module.exports = function(app, config, ModulesClass) {
    
    app.get('/redirect/:type/:id', (req, res, next) => {
      var type = req.params.type;
      var id = req.params.id;
      
      switch (type) {
        case 'page':
          new ModulesClass(config)
            .pages.resolvePath(id)
            .callback((data) => {
              if (data) {
                res.redirect(util.format("%s/%s", Common.CONTENT_FOLDER, data));  
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
    
    // Register common data middleware
    
    require(__dirname + '/common-data')(app, config, ModulesClass);
    
    // Register routes

    require(__dirname + '/root')(app, config, ModulesClass);
    require(__dirname + '/shortlinks')(app, config, ModulesClass);
    require(__dirname + '/banners')(app, config, ModulesClass);
    require(__dirname + '/events')(app, config, ModulesClass);
    require(__dirname + '/pages')(app, config, ModulesClass);
    require(__dirname + '/files')(app, config, ModulesClass);
    require(__dirname + '/tiles')(app, config, ModulesClass);
    require(__dirname + '/publictransport')(app, config, ModulesClass);
    require(__dirname + '/jobs')(app, config, ModulesClass);
    require(__dirname + '/announcements')(app, config, ModulesClass);
    require(__dirname + '/news')(app, config, ModulesClass);
    require(__dirname + '/search')(app, config, ModulesClass);
    
    // Register error routes. Keep these as last to ensure catch all functionality
    
    require(__dirname + '/error')(app, config, ModulesClass);
  };

}).call(this);