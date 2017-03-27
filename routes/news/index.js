/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const Common = require(__dirname + '/../common');

  module.exports = (app, config, ModulesClass) => {

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
    
  };

}).call(this);