/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const moment = require('moment');
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

    app.get(util.format('%s/:id', Common.FILES_FOLDER), (req, res, next) => {
      var id = req.params.id;
      if (!id) {
        next({
          status: 404
        });
        
        return;
      }
      
      new ModulesClass(config)
        .files.findById(id)
        .files.streamData(id)
        .callback((result) => {
          var file = result[0];
          var stream = result[1];
          
          if (file && stream) {
            res
              .set('Content-Length', file.size)
              .set('Content-Type', file.contentType)
              .set("content-disposition", util.format("attachment; filename=%s", file.slug));
            stream.pipe(res);
          } else {
            next({
              status: 500,
              message: "Tiedoston lataus epäonnistui"
            });
          }
        });
    });
    
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

    app.get(util.format('%s/:slug', Common.NEWS_FOLDER), (req, res, next) => {
      var slug = req.params.slug;

      if (!slug) {
        next({
          status: 404
        });
        return;
      }

      new ModulesClass(config)
        .news.latest(0, 10)
        .news.findBySlug(slug)
        .callback(function(data) {
          var newsArticle = data[1];
          var siblings = data[0];
          if (!newsArticle) {
            next({
              status: 404
            });
            return;
          }
          // TODO: Banner should come from API
          var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';

           res.render('pages/news-article.pug', Object.assign(req.kuntaApi.data, {
            id: newsArticle.id,
            slug: newsArticle.slug,
            title: newsArticle.title,
            contents: Common.processPageContent('/', newsArticle.contents),
            sidebarContents: Common.getSidebarContent(newsArticle.contents),
            imageSrc: newsArticle.imageSrc,
            bannerSrc: bannerSrc,
            siblings: siblings,
            breadcrumbs : [{path: util.format('%s/%s', Common.NEWS_FOLDER, newsArticle.slug), title: newsArticle.title }]
          }));

        }, (err) => {
          next({
            status: 500,
            error: err
          });
        });
    });

    app.get(util.format('%s/:slug', Common.ANNOUNCEMENTS_FOLDER), (req, res, next) => {
      var slug = req.params.slug;

      if (!slug) {
        next({
          status: 404
        });
        return;
      }
      
        new ModulesClass(config)
        .announcements.list(Common.ANNOUNCEMENT_COUNT_PAGE, 'PUBLICATION_DATE', 'DESCENDING')
        .announcements.findBySlug(slug)
        .callback(function(data) {
          var announcement = data[1];
          var siblings = data[0];
          if (!announcement) {
            next({
              status: 404
            });
            return;
          }
          // TODO: Banner should come from API
          var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';

           res.render('pages/announcement.pug', Object.assign(req.kuntaApi.data, {
            id: announcement.id,
            slug: announcement.slug,
            title: announcement.title,
            contents: Common.processPageContent('/', announcement.contents),
            sidebarContents: Common.getSidebarContent(announcement.contents),
            bannerSrc: bannerSrc,
            siblings: siblings,
            breadcrumbs : [{path: util.format('%s/%s', Common.ANNOUNCEMENTS_FOLDER, announcement.slug), title: announcement.title }]
          }));

        }, function(err) {
          next({
            status: 500,
            error: err
          });
        });
    });
    
    app.get(util.format('%s/:id', Common.JOBS_FOLDER), (req, res) => {
      var id = req.params.id;
      if (!id) {
        res.status(404).send('Not found');
        return;
      }
      
      new ModulesClass(config)
      .jobs.findById(id)
      .jobs.list(100, 'PUBLICATION_END', 'ASCENDING')
      .callback((data) => {
        var activeJob = Object.assign(data[0], {
          "endTime": moment(data[0].publicationEnd).format('DD.MM.YYYY HH:mm'),
          "description": Common.plainTextParagraphs(data[0].description)
        });
        
        var jobs = _.clone(data[1] || []);
        var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
        
        res.render('pages/jobs.pug', Object.assign(req.kuntaApi.data, {
          activeJob: activeJob,
          jobs: jobs,
          bannerSrc: bannerSrc,
          breadcrumbs : [{path: util.format('%s/%s', Common.JOBS_FOLDER, activeJob.id), title: activeJob.title }]
        }));

      }, (err) => {
        console.error(err);
        res.status(500).send(err);
      });
    });

    require(__dirname + '/root')(app, config, ModulesClass);
    require(__dirname + '/shortlinks')(app, config, ModulesClass);
    require(__dirname + '/banners')(app, config, ModulesClass);
    require(__dirname + '/events')(app, config, ModulesClass);
    require(__dirname + '/pages')(app, config, ModulesClass);
    require(__dirname + '/tiles')(app, config, ModulesClass);
    require(__dirname + '/publictransport')(app, config, ModulesClass);

    app.use((data, req, res, next) => {
      renderErrorPage(req, res, data.status || 500, data.message, data.error);
    });
    
    app.use((req, res, next) => {
      // Catch all for unhandled routes
      renderErrorPage(req, res, 404);      
    });
  };

}).call(this);