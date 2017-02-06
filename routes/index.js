/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const moment = require('moment');
  const _ = require('lodash');
  const cheerio = require('cheerio');

  const EVENT_COUNT = 9;
  const JOB_COUNT = 5;
  const ANNOUNCEMENT_COUNT = 5;
  const ANNOUNCEMENT_COUNT_PAGE = 10;
  const SOCIAL_MEDIA_POSTS = 4 * 3;
  const FILES_FOLDER = '/tiedostot';
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
    
    $('aside').find('*[contenteditable]').removeAttr('contenteditable');

    $('aside').find('img')
      .removeAttr('srcset')
      .removeAttr('width')
      .removeAttr('sizes')
      .removeAttr('class')
      .removeAttr('height');

    return $('aside').html();
  }

  module.exports = function(app, config, ModulesClass) {

    function loadChildPages(pages, preferLanguages, callback) {
      var module = new ModulesClass(config);
      
      pages.forEach((page) => {
        if (!page.meta || !page.meta.hideMenuChildren) {
          module.pages.listMetaByParentId(page.id, preferLanguages);
        }
      });
      
      module.callback(function (data) {
        var index = 0;
        pages.forEach((page) => {
          if (!page.meta || !page.meta.hideMenuChildren) {
            pages[index].hasChildren = data[index] && data[index].length > 0;
            index++;
          }
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
        }, (err) => {
       	  next({
       	    status: 500,
       	    error: err
       	  });
        });
    });
    
    function renderErrorPage(req, res, status, message, error) {
      var page;
      
      switch (status) {
        case 404:
          page = status;
        break;
        default:
          page = 500;
        break;
      }
      
      var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
      
      res.status(status);
      res.render(util.format('error/%d', page), Object.assign(req.kuntaApi.data, {
        bannerSrc: bannerSrc,
        error: error,
        message: message
      }));
    }
    
    app.get('/', (req, res, next) => {
      new ModulesClass(config)
        .events.latest(EVENT_COUNT, 'START_DATE', 'DESCENDING')
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

        }, (err) => {
          next({
            status: 500,
            error: err
          });
        });
    });
    
    app.get('/redirect/:type/:id', (req, res, next) => {
      var type = req.params.type;
      var id = req.params.id;
      
      switch (type) {
        case 'page':
          new ModulesClass(config)
            .pages.resolvePath(id)
            .callback((data) => {
              if (data) {
                res.redirect(util.format("%s/%s", CONTENT_FOLDER, data));  
              } else {
                res.redirect('/');
              }
            });
        break;
        case 'file':
          res.redirect(util.format("%s/%s", FILES_FOLDER, id));
        break;
        default:
          next({
            status: 400,
            message: 'Invalid type'
          });
        break;
      }
    });

    app.get(util.format('%s/:id', FILES_FOLDER), (req, res, next) => {
      var id = req.params.id;
      if (!id) {
        next({
          status: 404
        });
        
        return;
      }
      
      new ModulesClass(config)
        .files.findById(id)
        .files.streamData(id)
        .callback((result) => {
          var file = result[0];
          var stream = result[1];
          
          if (file && stream) {
            res
              .set('Content-Length', file.size)
              .set('Content-Type', file.contentType)
              .set("content-disposition", util.format("attachment; filename=%s", file.slug));
            stream.pipe(res);
          } else {
            next({
              status: 500,
              message: "Tiedoston lataus epäonnistui"
            });
          }
        });
    });
    
    app.get('/ajax/pagenav', (req, res) => {
      var pageId = req.query.pageId;
      var preferLanguages = req.headers['accept-language'];
      
      new ModulesClass(config)
        .pages.listMetaByParentId(pageId, preferLanguages)
        .callback(function(data) {
          loadChildPages(data[0], preferLanguages, (children) => {
            res.render('ajax/pagenav.pug', {
              childPages: children,
              activeIds: []
            });
          });
        });
    });
    
    app.get('/ajax/search', (req, res) => {
      var search = req.query.search;
      var preferLanguages = req.headers['accept-language'];
      
      new ModulesClass(config)
        .pages.search(search, preferLanguages)
        .files.search(search, preferLanguages)
        .callback(function(data) {
          var pages = data[0];
          var files = data[1];
          
          res.render('ajax/search.pug', {
            pages: pages,
            files: files
          });
        });
    });
    
    function mapOpenChildren(children, activeIds, openTreeNodes) {
      if (openTreeNodes.length > 0) {
        for (var i = 0; i < children.length; i++) {
          if (activeIds.indexOf(children[i].id) != -1) {
            children[i].children = openTreeNodes.shift();
            mapOpenChildren(children[i].children, activeIds, openTreeNodes);
            break;
          }
        }
      }
      
      return children;
    }

    app.get(util.format('%s*', CONTENT_FOLDER), (req, res, next) => {
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
            next({
              status: 404
            });
            return;
          }
          
          new ModulesClass(config)
            .pages.getContent(page.id, preferLanguages)
            .pages.resolveBreadcrumbs(CONTENT_FOLDER, page, preferLanguages)
            .pages.listMetaByParentId(rootPage.id, preferLanguages)
            .pages.readMenuTree(rootPage.id, page.parentId, preferLanguages)
            .callback(function(pageData) {
              var contents = pageData[0];
              var breadcrumbs = pageData[1];
              var rootFolderTitle = rootPage.title;
              var featuredImageSrc = page.featuredImageSrc ? page.featuredImageSrc : '/gfx/layout/mikkeli-page-image-default.jpg';
              // TODO: Banner should come from API
              var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
              var openTreeNodes = pageData[3];
              var activeIds = _.map(breadcrumbs, (breadcrumb) => {
                return breadcrumb.id;
              });
              
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
                  activeIds: activeIds,
                  children: mapOpenChildren(children, activeIds, openTreeNodes),
                  openTreeNodes: openTreeNodes,
                  bannerSrc: bannerSrc
                });
              });

            }, (contentErr) => {
              next({
                status: 500,
                error: contentErr
              });
            });

        }, (err) => {
          next({
            status: 500,
            error: err
          });
        });
    });

    app.get(util.format('%s/:slug', NEWS_FOLDER), (req, res, next) => {
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

        }, (err) => {
          next({
            status: 500,
            error: err
          });
        });
    });

    app.get(util.format('%s/:slug', ANNOUNCEMENTS_FOLDER), (req, res, next) => {
      var slug = req.params.slug;

      if (!slug) {
        next({
          status: 404
        });
        return;
      }
      
        new ModulesClass(config)
        .announcements.list(ANNOUNCEMENT_COUNT_PAGE, 'PUBLICATION_DATE', 'DESCENDING')
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
          next({
            status: 500,
            error: err
          });
        });
    });

    
    app.use((data, req, res, next) => {
      renderErrorPage(req, res, data.status || 500, data.message, data.error);
    });
    
    app.use((req, res, next) => {
      // Catch all for unhandled routes
      renderErrorPage(req, res, 404);      
    });

  };

}).call(this);