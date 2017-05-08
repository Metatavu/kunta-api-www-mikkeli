/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const moment = require('moment');
  const Common = require(__dirname + '/../common');

  module.exports = (app, config, ModulesClass) => {
    
    app.get('/newsArticleImages/:newsArticleId/:imageId', (req, res, next) => {
      var newsArticleId = req.params.newsArticleId;
      var imageId = req.params.imageId;
      
      if (!newsArticleId || !imageId) {
        next({
          status: 404
        });
        
        return;
      }
      
      new ModulesClass(config)
        .news.streamImageData(newsArticleId, imageId, req.query, req.headers)
        .callback((result) => {
          var stream = result[0];
          
          if (stream) {
            stream.pipe(res);
          } else {
            next({
              status: 500,
              message: "Kuvan lataus epäonnistui"
            });
          }
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

          var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
          res.render('pages/news-article.pug', Object.assign(req.kuntaApi.data, {
            id: newsArticle.id,
            slug: newsArticle.slug,
            title: newsArticle.title,
            tags: newsArticle.tags,
            contents: Common.processPageContent('/', newsArticle.contents),
            sidebarContents: Common.getSidebarContent(newsArticle.contents),
            imageSrc: newsArticle.imageId ? util.format('/newsArticleImages/%s/%s', newsArticle.id, newsArticle.imageId) : null,
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

    app.get(Common.NEWS_FOLDER + '/', (req, res, next) => {
      const prePage = Common.NEWS_COUNT_PAGE;
      let tag = req.query.tag;
      let page = tag ? null : parseInt(req.query.page)||0;
      let module = new ModulesClass(config);
        
      (tag ? module.news.listByTag(tag) : module.news.latest(page * prePage, prePage + 1))
        .callback((data) => {
          let lastPage = data[0].length < prePage + 1;
          let newsArticles = data[0].splice(0, prePage).map(newsArticle => {
            return Object.assign(newsArticle, {
              "shortDate": moment(newsArticle.published).format("D.M.YYYY"),
              "imageSrc": newsArticle.imageId ? util.format('/newsArticleImages/%s/%s', newsArticle.id, newsArticle.imageId) : null
            });
          });

          let bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
         
          
          res.render('pages/news-list.pug', Object.assign(req.kuntaApi.data, {
            page: page,
            lastPage: lastPage,
            newsArticles: newsArticles,
            bannerSrc: bannerSrc,
            tag: tag,
            breadcrumbs : [{path: util.format('%s/?tag=%s', Common.NEWS_FOLDER, tag), title: tag ? util.format("Uutiset tagilla '%s'", tag) : 'Uutiset'}]
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