(function() {
  
  var moment = require('moment');
  var _ = require('lodash');
  
  var EVENT_PAGES = 3;
  var EVENTS_PER_PAGE = 3;
  
  module.exports = function(app, modules) {
  
    app.get('/', function(req, res) {
      
      modules
        .events.latest(EVENT_PAGES * EVENTS_PER_PAGE)
        .news.latest(0, 9)
        .banners.list()
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
              "shortDate": moment(newsArticle.published).format("DD.MM.YYYY")
            });
          });

          var banners = _.clone(data[2]||[]).map(banner => {
            return Object.assign(banner, {
              imageSrc: banner.imageSrc ? banner.imageSrc : '/gfx/layout/mikkeli-banner-default.jpg'
            });
          });
          
          res.render('pages/index.pug', { 
            eventPages: eventPages,
            banners: banners,
            news: {
              top: news.splice(0, 1)[0],
              thumbs: news.splice(0, 4),
              texts: news
            }
          });
         
        }, function (err) {
          console.log(err);
          res.status(500).send(err);
        });
    });
    
  };
  
}).call(this);