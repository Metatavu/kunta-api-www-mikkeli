(function() {
  
  var moment = require('moment');
  var _ = require('lodash');
  
  var EVENT_PAGES = 3;
  var EVENTS_PER_PAGE = 3;
  var SOCIAL_MEDIA_POSTS = 4 * 3;
  
  module.exports = function(app, config, ModulesClass) {
  
    app.use(function (req, res, next) {
      var modules = new ModulesClass(config);
      
      modules.menus.list()
       .callback(function (data) {
         var menus = data[0];
         
         _.keys(menus).forEach(menuKey => {
            var menu = menus[menuKey];
         
         	menu.items = menu.items.map(item => {
              if (item.url && item.url.startsWith('/')) {
                item.url = '/sisalto' + item.url;
              }
              
              return item;
            });
         });
       
          req.kuntaApi = {
            data: {
              menus: menus
            }
          };
          
          next();
       }, function (err) {
       	  console.error(err);
          res.status(500).send(err);
       });
    });
  
    app.get('/', function(req, res) {
      new ModulesClass(config)
        .events.latest(EVENT_PAGES * EVENTS_PER_PAGE)
        .news.latest(0, 9)
        .banners.list()
        .tiles.list()
        .socialMedia.latest(SOCIAL_MEDIA_POSTS)
        .callback(function (data) {
          var events = _.clone(data[0]||[]).map(event => {
            return Object.assign(event, {
              "shortDate": moment(event.start).format("D/M")
            });
          });
          
          var eventPages = [];
          while (events.length) {
            eventPages.push(events.splice(0, EVENTS_PER_PAGE));
          }

          var news = _.clone(data[1]).map(newsArticle => {
            return Object.assign(newsArticle, {
              "shortDate": moment(newsArticle.published).format("D.M.YYYY")
            });
          });

          var banners = _.clone(data[2]||[]).map(banner => {
            return Object.assign(banner, {
              imageSrc: banner.imageSrc ? banner.imageSrc : '/gfx/layout/mikkeli-banner-default.jpg'
            });
          });
          
          var tiles = _.clone(data[3]||[]).map(tile => {
            return Object.assign(tile, {
              imageSrc: tile.imageSrc ? tile.imageSrc : '/gfx/layout/mikkeli-tile-default.jpg'
            });
          });
          
          var socialMediaItems = _.clone(data[4]||[]).map(socialMediaItem => {
            return Object.assign(socialMediaItem, {
              "shortDate": moment(socialMediaItem.created).format("D.M.YYYY hh:mm")
            });
          });
          
          res.render('pages/index.pug', { 
            eventPages: eventPages,
            banners: banners,
            tiles: tiles,
            socialMediaItems: socialMediaItems,
            news: {
              top: news.splice(0, 1)[0],
              thumbs: news.splice(0, 4),
              texts: news
            },
            menus: req.kuntaApi.data.menus
          });
         
        }, function (err) {
          console.error(err);
          res.status(500).send(err);
        });
    });
  
    app.get('/sisalto*', function(req, res) {
      var path = req.path.substring(9);
      var preferLanguages = req.headers['accept-language'];
      
      new ModulesClass(config)
        .pages.findByPath(path, preferLanguages)
        .callback(function (data) {
          var page = data[0];
          if (!page) {
            res.status(404).send("Not Found");
            return;
          }
          
          new ModulesClass(config)  
            .pages.getContent(page.id, preferLanguages)
            .pages.resolveBreadcrumbs(page, preferLanguages)
            .pages.listMetaByParentId(page.parentId, preferLanguages)
            .pages.listMetaByParentId(page.id, preferLanguages)
            .callback(function (pageData) {
              var contents = pageData[0];
              var breadcrumbs = pageData[1];
              var siblings = pageData[2];
              var children = pageData[3];
              var folderTitle = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1].title : page.title;
              var featuredImageSrc = page.featuredImageSrc ? page.featuredImageSrc + '?size=750' : '/gfx/layout/mikkeli-page-image-default.jpg';
              // TODO: Banner should come from API
              var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
              
              res.render('pages/contents.pug', {
                id: page.id,
                slug: page.slug,
                title: page.title,
                folderTitle: folderTitle,
                contents: contents,
                breadcrumbs: breadcrumbs,
                featuredImageSrc: featuredImageSrc,
                menus: req.kuntaApi.data.menus,
                siblings: siblings,
                children: children,
                bannerSrc: bannerSrc
              });
            }, function (contentErr) {
              console.error(contentErr);
              res.status(500).send(contentErr);
            });
          
        }, function (err) {
          console.error(err);
          res.status(500).send(err);
        });
    });
    
  };
  
}).call(this);