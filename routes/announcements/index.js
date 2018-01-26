/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const util = require('util');
  const Common = require(__dirname + '/../common');
  const moment = require('moment');
  const _ = require('lodash');
  const $ = require('cheerio');

  module.exports = (app, config, ModulesClass) => {

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

          var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';

           res.render('pages/announcement.pug', Object.assign(req.kuntaApi.data, {
            id: announcement.id,
            slug: announcement.slug,
            title: announcement.title,
            contents: Common.processPageContent('/', announcement.contents),
            sidebarContents: Common.getSidebarContent(announcement.contents),
            bannerSrc: bannerSrc,
            siblings: siblings,
            breadcrumbs : [{
              path: Common.ANNOUNCEMENTS_FOLDER, 
              title: 'Kuulutukset'
            }, {
              path: util.format('%s/%s', Common.ANNOUNCEMENTS_FOLDER, announcement.slug), 
              title: announcement.title
            }]
          }));

        }, function(err) {
          next({
            status: 500,
            error: err
          });
        });
    });

    app.get(Common.ANNOUNCEMENTS_FOLDER + '/', (req, res, next) => {
      const perPage = Common.ANNOUNCEMENT_COUNT_PAGE;
      let page = parseInt(req.query.page) || 0;
        
      new ModulesClass(config)
        .announcements.listFrom(page * perPage, perPage + 1, 'PUBLICATION_DATE', 'DESCENDING')
        .callback((data) => {
          let lastPage = data[0].length < perPage + 1;
          let announcements = data[0].splice(0, perPage).map(announcement => {
            return Object.assign(announcement, {
              "shortDate": moment(announcement.published).format("D.M.YYYY"),
              "shortContent": _.truncate($.load(announcement.contents||'').text(), {
                'length': 200,
              })
            });
          });
         
          const bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
         
          res.render('pages/announcements-list.pug', Object.assign(req.kuntaApi.data, {
            page: page,
            lastPage: lastPage,
            bannerSrc: bannerSrc,
            announcements: announcements,
            breadcrumbs : [{path: util.format('%s/', Common.ANNOUNCEMENTS_FOLDER), title: 'Kuulutukset'}]
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