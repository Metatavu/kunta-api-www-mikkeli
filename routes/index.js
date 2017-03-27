/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const Common = require(__dirname + '/common');

  module.exports = function(app, config, ModulesClass) {

    app.use(function(req, res, next) {
      var modules = new ModulesClass(config);

      modules
        .menus.list()
        .fragments.list()
        .callback(function(data) {
          var menus = data[0];
          var fragments = data[1];
          
          _.keys(menus).forEach(menuKey => {
            var menu = menus[menuKey];

            menu.items = menu.items.map(item => {
              if (item.url) {
                item.url = Common.processLink(null, item.url);
              }

              return item;
            });
          });
          
          var fragmentMap = {};
          fragments.forEach((fragment) => {
            fragmentMap[fragment.slug] = fragment.contents;
          });

          req.kuntaApi = {
            data: {
              menus: menus,
              fragmentMap: fragmentMap
            }
          };

          next();
        }, (err) => {
       	  next({
       	    status: 500,
       	    error: err
       	  });
        });
    });
    
    function renderErrorPage(req, res, status, message, error) {
      var page;
      
      switch (status) {
        case 404:
          page = status;
        break;
        default:
          page = 500;
        break;
      }
      
      if (error) {
        console.error(error);
      }
      
      if (message) {
        console.error(message);
      }
      
      var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
      
      res.status(status);
      res.render(util.format('error/%d', page), Object.assign(req.kuntaApi.data, {
        bannerSrc: bannerSrc,
        error: error,
        message: message
      }));
    }
    
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

    app.use((data, req, res, next) => {
      renderErrorPage(req, res, data.status || 500, data.message, data.error);
    });
    
    app.use((req, res, next) => {
      // Catch all for unhandled routes
      renderErrorPage(req, res, 404);      
    });
  };

}).call(this);