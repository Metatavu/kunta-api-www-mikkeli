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
  const PAGE_IMAGES_FOLDER = '/pageImages';
  const NEWS_FOLDER = '/uutiset';
  const ANNOUNCEMENTS_FOLDER = '/kuulutukset';
  const JOBS_FOLDER = '/tyot';
  
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

    $('a[href]').each((index, link) => {
      var href = $(link).attr('href');
      $(link).attr('href', processLink(currentPage, href));
    });

    $('img[src]').each((index, img) => {
      var src = $(img).attr('src');
      $(img)
        .addClass('lazy')
        .removeAttr('src')
        .removeAttr('srcset')
        .attr('data-original', src);
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
  
  function plainTextParagraphs(text) {
    var result = [];
    var paragraphs = (text||'').split('\n');
    
    for (var i = 0; i < paragraphs.length; i++) {
      result.push(util.format('<p>%s</p>', paragraphs[i]));
    }
    
    return result.join('');
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

      modules
        .menus.list()
        .fragments.list()
        .callback(function(data) {
          var menus = data[0];
          var fragments = data[1];
          
          _.keys(menus).forEach(menuKey => {
            var menu = menus[menuKey];

            menu.items = menu.items.map(item => {
              if (item.url) {
                item.url = processLink(null, item.url);
              }

              return item;
            });
          });
          
          var fragmentMap = {};
          fragments.forEach((fragment) => {
            fragmentMap[fragment.slug] = fragment.contents;
          });

          req.kuntaApi = {
            data: {
              menus: menus,
              fragmentMap: fragmentMap
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
      
      if (error) {
        console.error(error);
      }
      
      if (message) {
        console.error(message);
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
            var styles = [];
            
            if (banner.textColor) {
              styles.push(util.format('color: %s', banner.textColor));
            }

            if (banner.backgroundColor) {
              styles.push(util.format('background-color: %s', banner.backgroundColor));
            }
            
            return Object.assign(banner, {
              imageSrc: banner.imageSrc ? banner.imageSrc : '/gfx/layout/mikkeli-banner-default.jpg',
              style: styles.join(';')
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
    
    app.get(util.format('%s/:pageId/:type', PAGE_IMAGES_FOLDER), (req, res, next) => {
      var pageId = req.params.pageId;
      var type = req.params.type;
      var defaultImage;
      
      switch (type) {
        case 'featured':
          defaultImage = __dirname + '/../public/gfx/layout/mikkeli-page-image-default.jpg';
        break;
        case 'banner':
          defaultImage = __dirname + '/../public/gfx/layout/mikkeli-page-banner-default.jpg';
        break;
      }
      
      new ModulesClass(config)
        .pages.streamPageImageByType(pageId, type, defaultImage)
        .callback((data) => {
          if (data[0]) {
            var stream = data[0].stream;
            var attachment = data[0].attachment;
            
            if (attachment) {
              res.set('Content-Length', attachment.size);
            }

            res.set('Content-Type', attachment ? attachment.contentType : 'image/jpeg');

            if (stream) {
              stream.pipe(res);
            } else {
              next({
                status: 404
              });
            }
          } else {
            next({
              status: 404
            });
          }
        });
    });
    
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
            .pages.readMenuTree(rootPage.id, page.id, preferLanguages)
            .callback(function(pageData) {
              var contents = pageData[0];
              var breadcrumbs = pageData[1];
              var rootFolderTitle = rootPage.title;
              var featuredImageSrc = util.format('%s/%s/%s', PAGE_IMAGES_FOLDER, page.id, 'featured');
              var bannerSrc = util.format('%s/%s/%s', PAGE_IMAGES_FOLDER, page.id, 'banner');
              var openTreeNodes = pageData[3];
              var activeIds = _.map(breadcrumbs, (breadcrumb) => {
                return breadcrumb.id;
              });
              
              loadChildPages(pageData[2], preferLanguages, (children) => {
                res.render('pages/contents.pug', Object.assign(req.kuntaApi.data, {
                  id: page.id,
                  slug: page.slug,
                  rootPath: util.format("%s/%s", CONTENT_FOLDER, rootPath),
                  title: page.title,
                  rootFolderTitle: rootFolderTitle,
                  contents: processPageContent(path, contents),
                  sidebarContents: getSidebarContent(contents),
                  breadcrumbs: breadcrumbs,
                  featuredImageSrc: featuredImageSrc,
                  activeIds: activeIds,
                  children: mapOpenChildren(children, activeIds, openTreeNodes),
                  openTreeNodes: openTreeNodes,
                  bannerSrc: bannerSrc
                }));
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

           res.render('pages/news-article.pug', Object.assign(req.kuntaApi.data, {
            id: newsArticle.id,
            slug: newsArticle.slug,
            title: newsArticle.title,
            contents: processPageContent('/', newsArticle.contents),
            sidebarContents: getSidebarContent(newsArticle.contents),
            imageSrc: newsArticle.imageSrc,
            bannerSrc: bannerSrc,
            siblings: siblings,
            breadcrumbs : [{path: util.format('%s/%s', NEWS_FOLDER, newsArticle.slug), title: newsArticle.title }]
          }));

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

           res.render('pages/announcement.pug', Object.assign(req.kuntaApi.data, {
            id: announcement.id,
            slug: announcement.slug,
            title: announcement.title,
            contents: processPageContent('/', announcement.contents),
            sidebarContents: getSidebarContent(announcement.contents),
            bannerSrc: bannerSrc,
            siblings: siblings,
            breadcrumbs : [{path: util.format('%s/%s', ANNOUNCEMENTS_FOLDER, announcement.slug), title: announcement.title }]
          }));

        }, function(err) {
          next({
            status: 500,
            error: err
          });
        });
    });
    
    app.get(util.format('%s/:id', JOBS_FOLDER), (req, res) => {
      var id = req.params.id;
      if (!id) {
        res.status(404).send('Not found');
        return;
      }
      
      new ModulesClass(config)
      .jobs.findById(id)
      .jobs.list(100, 'PUBLICATION_END', 'ASCENDING')
      .callback((data) => {
        var activeJob = Object.assign(data[0], {
          "endTime": moment(data[0].publicationEnd).format('DD.MM.YYYY HH:mm'),
          "description": plainTextParagraphs(data[0].description)
        });
        
        var jobs = _.clone(data[1] || []);
        var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
        
        res.render('pages/jobs.pug', Object.assign(req.kuntaApi.data, {
          activeJob: activeJob,
          jobs: jobs,
          bannerSrc: bannerSrc,
          breadcrumbs : [{path: util.format('%s/%s', JOBS_FOLDER, activeJob.id), title: activeJob.title }]
        }));

      }, (err) => {
        console.error(err);
        res.status(500).send(err);
      });
    });
    
    app.get('/timetable', (req, res) => {
      var stopIds = req.query.stopId;
      if (!Array.isArray(stopIds)) {
        stopIds = [ stopIds ];
      }
      
      new ModulesClass(config)
        .publicTransport.findStopsByIds(stopIds)
        .callback((data) => {
          var stopMap = _.keyBy(data[0], 'id');
          res.render('pages/timetable.pug', {
            stops: stopMap
          });
        });
    });
    
    app.get('/ajax/timetable', (req, res) => {
      var stopIds = req.query.stopId;
      var departureTime = req.query.departureTime;
      if (!Array.isArray(stopIds)) {
        stopIds = [ stopIds ];
      }
      
      new ModulesClass(config)
        .publicTransport.listActiveStopTimesByStopIdsAndDepartureTimeAndDate(stopIds, departureTime, moment(), 'DEPARTURE_TIME', 'ASC', 0, 1000)
        .publicTransport.listActiveStopTimesByStopIdsAndDepartureTimeAndDate(stopIds, 0, moment().add(1, 'd'), 'DEPARTURE_TIME', 'ASC', 0, 1000)
        .publicTransport.findStopsByIds(stopIds)
        .callback((data) => {
          var todayStopTimes =  _.flatten(data[0]);
          var tomorrowStopTimes =  _.flatten(data[1]);
          var stopMap = _.keyBy(data[2], 'id');
          
          for (let i = 0; i < todayStopTimes.length;i++) {
            todayStopTimes[i].stop = stopMap[todayStopTimes[i].stopTime.stopId];
          }
          todayStopTimes.sort((a, b) => {
            return a.stopTime.departureTime - b.stopTime.departureTime;
          });

          for (let i = 0; i < tomorrowStopTimes.length;i++) {
            tomorrowStopTimes[i].stop = stopMap[tomorrowStopTimes[i].stopTime.stopId];
            tomorrowStopTimes[i].stopTime.departureTime = tomorrowStopTimes[i].stopTime.departureTime + 24 * 60 * 60;
          }
          tomorrowStopTimes.sort((a, b) => {
            return a.stopTime.departureTime - b.stopTime.departureTime;
          });

          res.render('ajax/timetable.pug', {
            timetables: todayStopTimes.concat(tomorrowStopTimes)
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