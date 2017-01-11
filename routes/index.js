/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const moment = require('moment');
  const _ = require('lodash');
  const cheerio = require('cheerio');
  const async = require('async');

  const EVENT_COUNT = 9;
  const JOB_COUNT = 5;
  const ANNOUNCEMENT_COUNT = 5;
  const ANNOUNCEMENT_COUNT_PAGE = 10;
  const SOCIAL_MEDIA_POSTS = 4 * 3;
  const CONTENT_FOLDER = '/sisalto';
  const NEWS_FOLDER = '/uutiset';
  const ANNOUNCEMENTS_FOLDER = '/kuulutukset';
  
  function resolveLinkType(link) {
    if (!link || link.startsWith('#')) {
      return 'NONE';
    }

    if (link.startsWith('/')) {
      return 'PATH';
    } else if (link.match(/[a-zA-Z]*:\/\/.*/)) {
      return 'ABSOLUTE';
    }

    return 'RELATIVE';
  }

  function processLink(currentPage, text) {
    if (!text) {
      return null;
    }

    var link = text.trim();
    if (!link) {
      return null;
    }

    switch (resolveLinkType(link)) {
      case 'PATH':
        return util.format('%s%s', CONTENT_FOLDER, link);
      case 'RELATIVE':
        return util.format('%s/%s', currentPage.split('/').splice(-1), link);
      default:
    }

    return link;
  }

  function processPageContent(currentPage, content) {
    if (!content) {
      return '';
    }

    const $ = cheerio.load(content);

    $('a[href]').each(function(index, link) {
      var href = $(link).attr('href');
      $(link).attr('href', processLink(currentPage, href));
    });
    
    $('aside').remove();

    return $.html();
  }

  function getSidebarContent(content) {
    if (!content) {
      return '';
    }
    
    const $ = cheerio.load(content);
    return $('aside').html();
  }

  module.exports = function(app, config, ModulesClass) {

    function loadChildPages(pages, preferLanguages, callback) {
      var module = new ModulesClass(config);
      
      pages.forEach((page) => {
        module.pages.listMetaByParentId(page.id, preferLanguages);
      });
      
      module.callback(function (data) {
        pages.forEach((page, index) => {
          pages[index].hasChildren = data[index] && data[index].length > 0;
        });
        
        callback(pages);
      });
    }

    app.use(function(req, res, next) {
      var modules = new ModulesClass(config);

      modules.menus.list()
        .callback(function(data) {
          var menus = data[0];

          _.keys(menus).forEach(menuKey => {
            var menu = menus[menuKey];

            menu.items = menu.items.map(item => {
              if (item.url) {
                item.url = processLink(null, item.url);
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
        }, function(err) {
       	  console.error(err);
          res.status(500).send(err);
        });
    });

    app.get('/', function(req, res) {
      new ModulesClass(config)
        .events.latest(EVENT_COUNT)
        .news.latest(0, 9)
        .banners.list()
        .tiles.list()
        .socialMedia.latest(SOCIAL_MEDIA_POSTS)
        .jobs.list(JOB_COUNT, 'PUBLICATION_END', 'ASCENDING')
        .announcements.list(ANNOUNCEMENT_COUNT, 'PUBLICATION_DATE', 'DESCENDING')
        .callback(function(data) {
          var events = _.clone(data[0] || []).map(event => {
            return Object.assign(event, {
              "shortDate": moment(event.start).format("D/M")
            });
          });

          var news = _.clone(data[1]).map(newsArticle => {
            return Object.assign(newsArticle, {
              "shortDate": moment(newsArticle.published).format("D.M.YYYY")
            });
          });

          var banners = _.clone(data[2] || []).map(banner => {
            return Object.assign(banner, {
              imageSrc: banner.imageSrc ? banner.imageSrc : '/gfx/layout/mikkeli-banner-default.jpg'
            });
          });

          var tiles = _.clone(data[3] || []).map(tile => {
            return Object.assign(tile, {
              imageSrc: tile.imageSrc ? tile.imageSrc : '/gfx/layout/mikkeli-tile-default.jpg'
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

          res.render('pages/index.pug', {
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
            },
            menus: req.kuntaApi.data.menus
          });

        }, function(err) {
          console.error(err);
          res.status(500).send(err);
        });
    });
    
    app.get('/ajax/pagenav', function (req, res) {
      var pageId = req.query.pageId;
      var preferLanguages = req.headers['accept-language'];
      
      new ModulesClass(config)
        .pages.listMetaByParentId(pageId, preferLanguages)
        .callback(function(data) {
          loadChildPages(data[0], preferLanguages, (children) => {
            res.render('ajax/pagenav.pug', {
              childPages: children
            });
          });
        });
    });

    app.get(util.format('%s*', CONTENT_FOLDER), function(req, res) {
      var path = req.path.substring(9);
      var rootPath = path.split('/')[0];
      var preferLanguages = req.headers['accept-language'];

      new ModulesClass(config)
        .pages.findByPath(path, preferLanguages)
        .pages.findByPath(rootPath, preferLanguages)
        .callback(function(data) {
          var page = data[0];
          var rootPage = data[1];
          if (!page || !rootPage) {
            res.status(404).send("Not Found");
            return;
          }

          new ModulesClass(config)
            .pages.getContent(page.id, preferLanguages)
            .pages.resolveBreadcrumbs(CONTENT_FOLDER, page, preferLanguages)
            .pages.listMetaByParentId(rootPage.id, preferLanguages)
            .callback(function(pageData) {
              var contents = pageData[0];
              var breadcrumbs = pageData[1];
              var rootFolderTitle = rootPage.title;
              var featuredImageSrc = page.featuredImageSrc ? page.featuredImageSrc : '/gfx/layout/mikkeli-page-image-default.jpg';
              // TODO: Banner should come from API
              var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';

              loadChildPages(pageData[2], preferLanguages, (children) => {
                res.render('pages/contents.pug', {
                  id: page.id,
                  slug: page.slug,
                  rootPath: util.format("%s/%s", CONTENT_FOLDER, rootPath),
                  title: page.title,
                  rootFolderTitle: rootFolderTitle,
                  contents: processPageContent(path, contents),
                  sidebarContents: getSidebarContent(contents),
                  breadcrumbs: breadcrumbs,
                  featuredImageSrc: featuredImageSrc,
                  menus: req.kuntaApi.data.menus,
                  children: children,
                  bannerSrc: bannerSrc
                });
              });

            }, function(contentErr) {
              console.error(contentErr);
              res.status(500).send(contentErr);
            });

        }, function(err) {
          console.error(err);
          res.status(500).send(err);
        });
    });

    app.get(util.format('%s/:slug', NEWS_FOLDER), function(req, res) {
      var slug = req.params.slug;

      if (!slug) {
        res.status(404).send('Not found');
        return;
      }

      new ModulesClass(config)
        .news.latest(0, 10)
        .news.findBySlug(slug)
        .callback(function(data) {
          var newsArticle = data[1];
          var siblings = data[0];
          if (!newsArticle) {
            res.status(404).send("Not Found");
            return;
          }
          // TODO: Banner should come from API
          var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';

           res.render('pages/news-article.pug', {
            id: newsArticle.id,
            slug: newsArticle.slug,
            title: newsArticle.title,
            contents: processPageContent('/', newsArticle.contents),
            sidebarContents: getSidebarContent(newsArticle.contents),
            imageSrc: newsArticle.imageSrc,
            menus: req.kuntaApi.data.menus,
            bannerSrc: bannerSrc,
            siblings: siblings,
            breadcrumbs : [{path: util.format('%s/%s', NEWS_FOLDER, newsArticle.slug), title: newsArticle.title }]
          });

        }, function(err) {
          console.error(err);
          res.status(500).send(err);
        });
    });

    app.get(util.format('%s/:slug', ANNOUNCEMENTS_FOLDER), function(req, res) {
      var slug = req.params.slug;

      if (!slug) {
        res.status(404).send('Not found');
        return;
      }
      
        new ModulesClass(config)
        .announcements.list(ANNOUNCEMENT_COUNT_PAGE, 'PUBLICATION_DATE', 'DESCENDING')
        .announcements.findBySlug(slug)
        .callback(function(data) {
          var announcement = data[1];
          var siblings = data[0];
          if (!announcement) {
            res.status(404).send("Not Found");
            return;
          }
          // TODO: Banner should come from API
          var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';

           res.render('pages/announcement.pug', {
            id: announcement.id,
            slug: announcement.slug,
            title: announcement.title,
            contents: processPageContent('/', announcement.contents),
            sidebarContents: getSidebarContent(announcement.contents),
            menus: req.kuntaApi.data.menus,
            bannerSrc: bannerSrc,
            siblings: siblings,
            breadcrumbs : [{path: util.format('%s/%s', ANNOUNCEMENTS_FOLDER, announcement.slug), title: announcement.title }]
          });

        }, function(err) {
          console.error(err);
          res.status(500).send(err);
        });
    });

  };

}).call(this);