/*jshint esversion: 6 */
/*global __dirname */
(function() {
  'use strict';

  const util = require('util');
  const moment = require('moment');
  const Common = require(__dirname + '/../common');
  const striptags = require('striptags');
  const Entities = require('html-entities').AllHtmlEntities;
  const entities = new Entities();

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
    
    app.get('/ajax/newsByTag/:tag', (req, res, next) => {
      const maxResults = parseInt(req.query.maxResults);
      const tag = req.params.tag;
      let module = new ModulesClass(config);
      
      console.log(maxResults);
      console.log(tag);
      
      const options = {
        tag: tag,
        page: 0,
        firstResult: 0,
        maxResults: maxResults,
        sortBy: 'ORDER_NUMBER_PUBLISHED'
      };
      
      module.news.listNews(options)
        .callback((data) => {
          console.log(data);
          res.json(data[0]);
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
          const siteUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
          const ogContent = entities.decode(striptags(newsArticle.contents));
          
          res.render('pages/news-article.pug', Object.assign(req.kuntaApi.data, {
            baseUrl : req.protocol + '://' + req.get('host'),
            ogTitle: entities.decode(newsArticle.title),
            ogContent: ogContent,
            summary: ogContent.substring(0, 256),
            id: newsArticle.id,
            slug: newsArticle.slug,
            title: newsArticle.title,
            tags: newsArticle.tags,
            contents: Common.processPageContent('/', newsArticle.contents),
            sidebarContents: Common.getSidebarContent('/', newsArticle.contents),
            imageSrc: newsArticle.imageId ? util.format('/newsArticleImages/%s/%s?size=670', newsArticle.id, newsArticle.imageId) : null,
            bannerSrc: bannerSrc,
            siblings: siblings,
            siteUrl: siteUrl,
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
      const perPage = Common.NEWS_COUNT_PAGE;
      let tag = req.query.tag || null;
      let page = parseInt(req.query.page)||0;
      let module = new ModulesClass(config);
      
      const options = {
        tag: tag,
        page: page,
        firstResult: page * perPage,
        maxResults: perPage + 1,
        sortBy: 'ORDER_NUMBER_PUBLISHED'
      };
        
      module.news.listNews(options)
        .callback((data) => {
          let lastPage = data[0].length < perPage + 1;
          let newsArticles = data[0].splice(0, perPage).map(newsArticle => {
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