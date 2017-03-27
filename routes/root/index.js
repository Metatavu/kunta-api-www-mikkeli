/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const moment = require('moment');
  const _ = require('lodash');
  const Common = require(__dirname + '/../common');

  module.exports = (app, config, ModulesClass) => {
    
    app.get('/', (req, res, next) => {
      new ModulesClass(config)
        .events.latest(Common.EVENT_COUNT, 'START_DATE', 'DESCENDING')
        .news.latest(0, 9)
        .banners.list()
        .tiles.list()
        .socialMedia.latest(Common.SOCIAL_MEDIA_POSTS)
        .jobs.list(Common.JOB_COUNT, 'PUBLICATION_END', 'ASCENDING')
        .announcements.list(Common.ANNOUNCEMENT_COUNT, 'PUBLICATION_DATE', 'DESCENDING')
        .callback(function(data) {
          var events = _.clone(data[0] || []).map(event => {
            return Object.assign(event, {
              "imageSrc": event.imageId ? util.format('/eventImages/%s/%s', event.id, event.imageId) : null,
              "shortDate": moment(event.start).format("D/M")
            });
          });

          var news = _.clone(data[1]).map(newsArticle => {
            return Object.assign(newsArticle, {
              "shortDate": moment(newsArticle.published).format("D.M.YYYY")
            });
          });

          var banners = _.clone(data[2] || []).map(banner => {
            var styles = [];
            
            if (banner.textColor) {
              styles.push(util.format('color: %s', banner.textColor));
            }

            if (banner.backgroundColor) {
              styles.push(util.format('background-color: %s', banner.backgroundColor));
            }
            
            return Object.assign(banner, {
              imageSrc: banner.imageId ? util.format('/bannerImages/%s/%s', banner.id, banner.imageId) : '/gfx/layout/mikkeli-banner-default.jpg',
              style: styles.join(';')
            });
          });

          var tiles = _.clone(data[3] || []).map(tile => {
            return Object.assign(tile, {
              imageSrc: tile.imageId ? util.format('/tileImages/%s/%s', tile.id, tile.imageId) : '/gfx/layout/mikkeli-tile-default.jpg'
            });
          });

          var socialMediaItems = _.clone(data[4] || []).map(socialMediaItem => {
            return Object.assign(socialMediaItem, {
              "shortDate": moment(socialMediaItem.created).format("D.M.YYYY hh:mm")
            });
          });

          var jobs = _.clone(data[5] || []);
          var announcements = _.clone(data[6] || []).map(announcement => {
            return Object.assign(announcement, {
              "shortDate": moment(announcement.published).format("D.M.YYYY")
            });
          });
          
          res.render('pages/index.pug', Object.assign(req.kuntaApi.data, {
            events: events,
            banners: banners,
            tiles: tiles,
            socialMediaItems: socialMediaItems,
            jobs: jobs,
            announcements: announcements,
            news: {
              top: news.splice(0, 1)[0],
              thumbs: news.splice(0, 4),
              texts: news
            }
          }));

        }, (err) => {
          next({
            status: 500,
            error: err
          });
        });
    });
  };

}).call(this);