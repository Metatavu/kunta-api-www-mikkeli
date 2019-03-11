/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const Common = require(__dirname + '/../common');

  module.exports = (app, config, ModulesClass) => {

    /**
     * Resolves root page for given page.
     * 
     * @param {Page} page 
     * @return root page for given page.
     */
    const resolveRootPage = async (page) => {
      const pagesModule = (new ModulesClass(config)).pages;
      const pageTree = await pagesModule.resolvePageTree(null, page.id);

      if (!pageTree || !pageTree.length) {
        return null;
      }

      let rootIndex = 0;
      while (pageTree[rootIndex] && pageTree[rootIndex].meta && pageTree[rootIndex].meta.siteRootPage) {
        rootIndex++;
      }

      if (pageTree[rootIndex]) {
        return pagesModule.processPage(pageTree[rootIndex]);
      }

      return pageTree[0];
    };
  
    const loadChildPages = (pages, preferLanguages) => {
      return new Promise((resolve) => {
        const module = new ModulesClass(config);
        
        pages.forEach((page) => {
          if (!page.meta || !page.meta.hideMenuChildren) {
            module.pages.listMetaByParentId(page.id, preferLanguages);
          }
        });
        
        module.callback((data) => {
          let index = 0;
          pages.forEach((page) => {
            if (!page.meta || !page.meta.hideMenuChildren) {
              pages[index].hasChildren = data[index] && data[index].length > 0;
              index++;
            }
          });
          
          resolve(pages);
        });
      });
    };
    
    function mapOpenChildren(children, activeIds, openTreeNodes) {
      if (openTreeNodes.length > 0) {
        for (var i = 0; i < children.length; i++) {
          if (activeIds.indexOf(children[i].id) !== -1) {
            children[i].children = openTreeNodes.shift();
            mapOpenChildren(children[i].children, activeIds, openTreeNodes);
            break;
          }
        }
      }
      
      return children;
    }
    
    app.get('/ajax/pagenav', (req, res) => {
      var pageId = req.query.pageId;
      var preferLanguages = req.headers['accept-language'];
      
      new ModulesClass(config)
        .pages.listMetaByParentId(pageId, preferLanguages)
        .callback(async (data) => {
          const children = await loadChildPages(data[0], preferLanguages);

          res.render("ajax/pagenav.pug", {
            childPages: children,
            activeIds: []
          });
        });
    });

    app.get('/pageImages/:pageId/:imageId', (req, res, next) => {
      var pageId = req.params.pageId;
      var imageId = req.params.imageId;
      
      if (!pageId || !imageId) {
        next({
          status: 404
        });
        
        return;
      }
      
      new ModulesClass(config)
        .pages.streamImageData(pageId, imageId, req.query, req.headers)
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

    app.get(util.format('%s*', Common.CONTENT_FOLDER), (req, res, next) => {
      var path = req.path.substring(9);
      var preferLanguages = req.headers['accept-language'];

      new ModulesClass(config)
        .pages.findByPath(path, preferLanguages)
        .callback(async (data) => {
          const page = data[0];
          if (!page) {
            next({
              status: 404
            });
            return;
          }

          const rootPage = await resolveRootPage(page);
          if (!rootPage) {
            next({
              status: 404
            });

            return;
          }

          new ModulesClass(config)
            .pages.resolvePath(rootPage.id)
            .pages.getContent(page.id, preferLanguages)
            .pages.resolveBreadcrumbs(Common.CONTENT_FOLDER, page, preferLanguages)
            .pages.listMetaByParentId(rootPage.id, preferLanguages)
            .pages.readMenuTree(rootPage.id, page.id, preferLanguages)
            .pages.listImages(page.id)
            .callback(async (pageData) => {
              const rootPath = pageData[0];
              var contents = pageData[1];
              let breadcrumbs = pageData[2];
              var rootFolderTitle = rootPage.title;
              var openTreeNodes = pageData[4];

              var images = pageData[5];
              let activeIds = _.map(breadcrumbs, (breadcrumb) => {
                return breadcrumb.id;
              });
              
              var featuredImageId = null;
              var bannerImageId = null;
              (images||[]).forEach((image) => {
                if (image.type === 'featured') {
                  featuredImageId = image.id;
                } else if (image.type === 'banner') {
                  bannerImageId = image.id;
                }
              });
              
              const featuredImageSrc = featuredImageId ? util.format('/pageImages/%s/%s?size=670', page.id, featuredImageId) : null;
              const bannerSrc = bannerImageId ? util.format('/pageImages/%s/%s', page.id, bannerImageId) : '/gfx/layout/mikkeli-page-banner-default.jpg';
              const kuntaApiPageMeta = Common.resolveKuntaApiPageMeta(contents);
              const template = kuntaApiPageMeta["page-template"] || "contents";
              
              const title = page.title;
              const children = rootPage.meta.hideMenuChildren ? [] : await loadChildPages(pageData[3], preferLanguages);
              
              res.render(`pages/${template}.pug`, Object.assign(req.kuntaApi.data, {
                id: page.id,
                slug: page.slug,
                rootPath: util.format("%s/%s", Common.CONTENT_FOLDER, rootPath),
                title: title,
                rootFolderTitle: rootFolderTitle,
                contents: Common.processPageContent(path, contents),
                sidebarContents: Common.getSidebarContent(path, contents),
                breadcrumbs: breadcrumbs,
                featuredImageSrc: featuredImageSrc,
                activeIds: activeIds,
                children: mapOpenChildren(children, activeIds, openTreeNodes),
                hideMenu: !!rootPage.meta.hideMenuChildren,
                openTreeNodes: openTreeNodes,
                bannerSrc: bannerSrc
              }));

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
    
  };

}).call(this);