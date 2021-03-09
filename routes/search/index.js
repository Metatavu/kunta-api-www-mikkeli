/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
  const cheerio = require('cheerio');
  const Promise = require('bluebird');
  const fetch = require('node-fetch');
  const Common = require(__dirname + '/../common');
  const Entities = require('html-entities').AllHtmlEntities;
  const entities = new Entities();
  
  module.exports = (app, config, ModulesClass) => {
    
    function findImageByType(images, type) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].type === type) {
          return images[i];
        }
      }        
    }

    app.get('/ajax/menuSearch', (req, res) => {
      const searchInput = req.query.search;
      const search = Common.processFreeTextSearch(searchInput);
      const preferLanguages = req.headers['accept-language'];

      const searchOptions = {
        search: search,
        firstResult: 0,
        maxResults: Common.SEARCH_RESULTS_PER_TYPE,
        sortBy: "SCORE",
        sortDir: "DESC"
      };
      
      new ModulesClass(config)
        .pages.search(searchOptions, preferLanguages)
        .files.search(search, 0, Common.SEARCH_RESULTS_PER_TYPE)
        .news.search(search, 0, Common.SEARCH_RESULTS_PER_TYPE)
        .callback(async (data) => {

          const pages = data[0].map((page) => {
            page.title = entities.decode(page.title);
            return page;
          });

          const files = data[1];

          const newsArticles = data[2].map((newsArticle) => {
            newsArticle.title = entities.decode(newsArticle.title);
            return newsArticle;
          });

          const wordpressPages = await new Promise(resolve => {
            fetch(`https://www.oppiminen.mikkeli.fi/wp-json/wp/v2/search?search=${ searchInput }`)
              .then((response) => response.json())
              .then((data) => resolve(data.splice(0, 5)));
          });
          
          res.render('ajax/menu-search.pug', {
            pages: pages,
            files: files,
            newsArticles: newsArticles,
            wordpressPages: wordpressPages
          });
        });
    });
    
    app.get('/ajax/search/pages', (req, res) => {
      const perPage = Common.SEARCH_PAGES_PER_PAGE;
      const search = Common.processFreeTextSearch(req.query.search);
      const preferLanguages = req.headers['accept-language'];
      const page = parseInt(req.query.page)||0;

      const searchOptions = {
        search: search,
        firstResult: page * perPage,
        maxResults: perPage + 1,
        sortBy: "SCORE",
        sortDir: "DESC"
      };
      
      new ModulesClass(config)
        .pages.search(searchOptions, preferLanguages)
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
              const title = entities.decode(pages[i].title);
              
              let image = findImageByType(images, 'featured');
              if (!image && images.length) {
                image = images[0];
              }
              
              pages[i] = Object.assign(pages[i], {
                title: title,
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
      const search = Common.processFreeTextSearch(req.query.search);
      const page = parseInt(req.query.page)||0;
      
      new ModulesClass(config)
        .files.search(search, page * perPage, (perPage + 1))
        .callback((data) => {
          const lastPage = data[0].length < perPage + 1;
          const files = data[0].splice(0, perPage);
          res.render('ajax/search-files.pug', {
            files: files,
            page: page,
            lastPage: lastPage
          });
        });
    });
    
    app.get('/ajax/search/news', (req, res) => {
      const perPage = Common.SEARCH_NEWS_PER_PAGE;
      const search = Common.processFreeTextSearch(req.query.search);
      const page = parseInt(req.query.page)||0;
      
      new ModulesClass(config)
        .news.search(search, page * perPage, (perPage + 1))
        .callback((data) => {
          const lastPage = data[0].length < perPage + 1;
          const newsArticles = data[0].splice(0, perPage).map(newsArticle => {
            return Object.assign(newsArticle, {
              "shortDate": moment(newsArticle.published).format("D.M.YYYY"),
              "imageSrc": newsArticle.imageId ? util.format('/newsArticleImages/%s/%s', newsArticle.id, newsArticle.imageId) : null,
              "abstract": Common.htmlToText(newsArticle.abstract)
            });
          });
          
          res.render('ajax/search-news.pug', {
            newsArticles: newsArticles,
            page: page,
            lastPage: lastPage
          });
        });
    });

    app.get('/ajax/search/wordpressPages', async (req, res) => {
      const perPage = Common.SEARCH_PAGES_PER_PAGE;
      const searchInput = req.query.search;
      const page = parseInt(req.query.page);
      
      const [wordpressPages, lastPage] = await Promise.all([
        new Promise(resolve => {
          fetch(`https://www.oppiminen.mikkeli.fi/wp-json/wp/v2/search?type=post&subtype[]=page&subtype[]=post&search=${ searchInput }&page=${ page + 1 }&per_page=${ perPage }`)
            .then((response) => response.json())
            .then( async (data) => {
              const posts = await Promise.all(
                data
                  .map(item => {
                    return new Promise(resolvePost => {
                      fetch(`https://www.oppiminen.mikkeli.fi/wp-json/wp/v2/${ item.subtype === "post" ? "posts" : "pages" }/${ item.id }`)
                        .then(response => resolvePost(response.json()))
                    });
                  })
              )
              resolve(
                posts.map(post => ({
                  id: post.id,
                  link: post.link,
                  title: post.title.rendered,
                  excerpt: post.excerpt.rendered,
                  imageSrc: "/gfx/layout/mikkeli-logo.png"
                }))
              );
            });
        }),
        new Promise(resolve => {
          fetch(`https://www.oppiminen.mikkeli.fi/wp-json/wp/v2/search?type=post&subtype[]=page&subtype[]=post&search=${ searchInput }&page=${ page + 2 }&per_page=${ perPage }`)
            .then((response) => response.json())
            .then( async (data) => {
              resolve(!data.length);
            });
        })
      ]);
      
      res.render('ajax/search-wp-pages.pug', {
        page: page,
        lastPage: lastPage,
        pages: wordpressPages
      });
    });
    
    app.get(util.format('%s/', Common.SEARCH_PATH), (req, res, next) => {
      const bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
      const search = req.query.search;
          
      res.render('pages/search.pug', Object.assign(req.kuntaApi.data, {
        bannerSrc: bannerSrc,
        search: search,
        breadcrumbs : [{path: util.format('%s/', Common.SEARCH_PATH), title: 'Haku'}]
      }));
    });
    
  };

}).call(this);