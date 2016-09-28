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
          req.kuntaApi = {
            data: {
              menus: data[0]
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
      
      new ModulesClass(config)
        .pages.findByPath(path, req.headers['accept-language'])
        .callback(function (data) {
          var page = data[0];
          if (!page) {
            res.status(404).send("Not Found");
            return;
          }
         
          res.render('pages/contents.pug', {
            title: page.title,
            contents: page.contents,
            featuredImageSrc: page.featuredImageSrc,
            menus: req.kuntaApi.data.menus
          });
          
        }, function (err) {
          console.error(err);
          res.status(500).send(err);
        });
    });
    
  };
  
}).call(this);