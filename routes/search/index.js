/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
  const cheerio = require('cheerio');
  const Promise = require('bluebird');
  const Common = require(__dirname + '/../common');
  
  module.exports = (app, config, ModulesClass) => {
    
    function findImageByType(images, type) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].type === type) {
          return images[i];
        }
      }        
    }

    app.get('/ajax/menuSearch', (req, res) => {
      const search = req.query.search;
      const preferLanguages = req.headers['accept-language'];
      
      new ModulesClass(config)
        .pages.search(search, preferLanguages, 0, Common.SEARCH_RESULTS_PER_TYPE)
        .files.search(search, 0, Common.SEARCH_RESULTS_PER_TYPE)
        .callback((data) => {
          var pages = data[0];
          var files = data[1];
          
          res.render('ajax/menu-search.pug', {
            pages: pages,
            files: files
          });
        });
    });
    
    app.get('/ajax/search/pages', (req, res) => {
      const perPage = Common.SEARCH_PAGES_PER_PAGE;
      const search = req.query.search;
      const preferLanguages = req.headers['accept-language'];
      let page = parseInt(req.query.page)||0;
      
      new ModulesClass(config)
        .pages.search(search, preferLanguages, page * perPage, (perPage + 1))
        .callback((data) => {
          const lastPage = data[0].length < perPage + 1;
          let pages = data[0].splice(0, perPage);
          
          const pagesModule = new ModulesClass(config);
          for (let i = 0; i < pages.length; i++) {
            const pageId = pages[i].id;
            pagesModule.pages.getContent(pageId, preferLanguages);
            pagesModule.pages.listImages(pageId);
          }
        
          pagesModule.callback((datas) => {
            for (let i = 0; i < pages.length; i++) {
              const content = datas[i * 2];
              const images =  datas[(i * 2) + 1];
              
              let image = findImageByType(images, 'featured');
              if (!image && images.length) {
                image = images[0];
              }
              
              pages[i] = Object.assign(pages[i], {
                excerpt: _.truncate(Common.htmlToText(content), {
                  length: 500
                }),
                imageSrc: image ? util.format('/pageImages/%s/%s', pages[i].id, image.id) : null
              });   
            }
            
            res.render('ajax/search-pages.pug', {
              pages: pages,
              page: page,
              lastPage: lastPage
            });
          });
        });
    });
    
    app.get('/ajax/search/files', (req, res) => {
      const perPage = Common.SEARCH_FILES_PER_PAGE;
      const search = req.query.search;
      let page = parseInt(req.query.page)||0;
      
      new ModulesClass(config)
        .files.search(search, page * perPage, (perPage + 1))
        .callback((data) => {
          const lastPage = data[0].length < perPage + 1;
          let files = data[0].splice(0, perPage);
          res.render('ajax/search-files.pug', {
            files: files,
            page: page,
            lastPage: lastPage
          });
        });
    });
    
    app.get('/ajax/search/news', (req, res) => {
      const perPage = Common.SEARCH_NEWS_PER_PAGE;
      const search = req.query.search;
      let page = parseInt(req.query.page)||0;
      
      new ModulesClass(config)
        .news.search(search, page * perPage, (perPage + 1))
        .callback((data) => {
          const lastPage = data[0].length < perPage + 1;
          const newsArticles = data[0].splice(0, perPage).map(newsArticle => {
            return Object.assign(newsArticle, {
              "shortDate": moment(newsArticle.published).format("D.M.YYYY"),
              "imageSrc": newsArticle.imageId ? util.format('/newsArticleImages/%s/%s', newsArticle.id, newsArticle.imageId) : null,
              "abstract": Common.htmlToText(newsArticle['abstract'])
            });
          });
          
          res.render('ajax/search-news.pug', {
            newsArticles: newsArticles,
            page: page,
            lastPage: lastPage
          });
        });
    });
    
    app.get(util.format('%s/', Common.SEARCH_PATH), (req, res, next) => {
      const bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
          
      res.render('pages/search.pug', Object.assign(req.kuntaApi.data, {
        bannerSrc: bannerSrc,
        breadcrumbs : [{path: util.format('%s/', Common.SEARCH_PATH), title: 'Haku'}]
      }));
    });
    
  };

}).call(this);