/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const cheerio = require('cheerio');
  const pug = require("pug");
  const LinkedEventsClient = require("linkedevents-client");
  const RssParser = require('rss-parser');
  const moment = require("moment");
  
  class Common {
    
    static get SEARCH_PATH() {
      return '/haku';
    }
    
    static get CONTENT_FOLDER() { 
      return '/sisalto';
    }
    
    static get PAGE_IMAGES_FOLDER() { 
      return '/pageImages';
    }
    
    static get EVENT_COUNT() { 
      return 9;
    }
    
    static get JOB_COUNT() { 
      return 5;
    }
    
    static get ANNOUNCEMENT_COUNT() { 
      return 3;
    }
    
    static get ANNOUNCEMENT_COUNT_PAGE() { 
      return 10;
    }
    
    static get NEWS_COUNT_PAGE() { 
      return 10;
    }
    
    static get SOCIAL_MEDIA_POSTS() { 
      return 4 * 3;
    }
    
    static get FILES_FOLDER() { 
      return '/tiedostot';
    }
    
    static get NEWS_FOLDER() { 
      return '/uutiset';
    }
    
    static get ANNOUNCEMENTS_FOLDER() { 
      return '/kuulutukset';
    }
    
    static get JOBS_FOLDER() { 
      return '/tyot';
    }
    
    static get TIMETABLE_ROWS() {
      return 15;
    }
    
    static get SEARCH_RESULTS_PER_TYPE() {
      return 5;
    }
    
    static get SEARCH_PAGES_PER_PAGE() {
      return 5;
    }
    
    static get SEARCH_FILES_PER_PAGE() {
      return 10;
    }
    
    static get SEARCH_NEWS_PER_PAGE() {
      return 5;
    }
    
    static get SEARCH_CONTACT_PER_TYPE() {
      return 10;
    }

    /**
     * Returns events API instance
     *
     * @returns {LinkedEventsClient.EventApi} events API instance
     */
    static getLinkedEventsEventsApi(config) {
      const apiUrl = config.get("linkedevents:api-url");

      const client = LinkedEventsClient.ApiClient.instance;
      client.basePath = apiUrl;
      return new LinkedEventsClient.EventApi();
    }
    
    static resolveLinkType(link) {
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
    
    static processLink(currentPage, text) {
      if (!text) {
        return null;
      }

      var link = text.trim();
      if (!link) {
        return null;
      }

      switch (Common.resolveLinkType(link)) {
        case 'PATH':
          return util.format('%s%s', Common.CONTENT_FOLDER, link);
        case 'RELATIVE':
          return util.format('%s/%s', currentPage.split('/').splice(-1), link);
        default:
      }

      return link;
    }

    static resolveKuntaApiPageMeta(content) {
      const result = {};
      
      if (content && _.trim(content)) {
        const $ = cheerio.load(content);

        $('.kunta-api-meta').each((index, metaElement) => {
          const name = $(metaElement).attr('name');
          const value = $(metaElement).attr('value');
          result[name] = value;
        });
      }
      
      return result;
    }
    
    /* @deprecated CaseM support has been removed from kunta-api */
    static resolvePageCasemMeta(content) {
      const result = {};
      
      if (content && _.trim(content)) {
        const $ = cheerio.load(content);

        $('.casem-meta').each((index, metaElement) => {
          const name = $(metaElement).attr('data-meta-name');
          const value = $(metaElement).attr('data-meta-value');
          result[name] = value;
        });
      }
      
      return result;
    }
    
    /**
     * Processes links within dom
     * 
     * @param {String} currentPage current page
     * @param {Cheerio} $ dom
     */
    static processDomLinks(currentPage, $) {
      $('a[href]').each((index, link) => {
        const href = $(link).attr('href');
        $(link).attr('href', Common.processLink(currentPage, href));
      });
    }
    
    static processPageContent(currentPage, content) {
      if (!content) {
        return '';
      }

      const $ = cheerio.load(content);
      
      $('aside').remove();
        
      Common.processDomLinks(currentPage, $);
      Common.processPageDomImages($);
      Common.lazyPageDomImages($);
      Common.processSmallPageBanners($);

      return $.html();
    }

    static getSidebarContent(currentPage, content) {
      if (!content) {
        return '';
      }
      
      const $ = cheerio.load(content);
      Common.processPageDomImages($);
      Common.processDomLinks(currentPage, $);
      
      $('aside').find('*[contenteditable]').removeAttr('contenteditable');

      $('aside').find('img')
        .removeAttr('srcset')
        .removeAttr('width')
        .removeAttr('sizes')
        .removeAttr('class')
        .removeAttr('height');

      return $('aside').html();
    }
    
    static processPageDomImages($) {
      $('.kunta-api-image[data-image-type="content-image"]').each((index, img) => {
        const pageId = $(img).attr('data-page-id');
        const imageId = $(img).attr('data-attachment-id');
        const width = parseInt($(img).attr('width'));
        const height = parseInt($(img).attr('height'));
        const size = width && height ? Math.min(width, height) : width || height || null;
        const src = util.format('/pageImages/%s/%s%s', pageId, imageId, size ? util.format('?size=%s', size) : '');
        
        $(img)
          .removeAttr('data-page-id')
          .removeAttr('data-attachment-id')
          .removeAttr('data-organization-id')
          .removeAttr('data-image-type')
          .attr('src', src);
      });
    }
    
    static processSmallPageBanners($) {
      if ($("a.small-page-banner").length) {
        const container = $("<div>").addClass("small-page-banners row").insertAfter($("a.small-page-banner")[0]);


        $("a.small-page-banner").each((index, bannerLink) => {
          const title = $(bannerLink).attr("title");
          const imageSrc = $(bannerLink).find("img").attr("data-original").replace(/(.*)\?.*/, "\$1");
          const href = $(bannerLink).attr("href");

          $(container).append($(pug.renderFile(`${__dirname}/../../views/fragments/small-page-banner.pug`, {
            title: title,
            imageSrc: imageSrc,
            href
          })));

          $(bannerLink).remove();
        });        
      }
    }
    
    static lazyPageDomImages($) {
      $('img[src]').each((index, img) => {
        const src = $(img).attr('src');
        $(img)
          .addClass('lazy')
          .removeAttr('src')
          .removeAttr('srcset')
          .attr('data-original', src);
      });
    }
    
    static plainTextParagraphs(text) {
      var result = [];
      var paragraphs = (text||'').split('\n');
      
      for (var i = 0; i < paragraphs.length; i++) {
        result.push(util.format('<p>%s</p>', paragraphs[i]));
      }
      
      return result.join('');
    }
    
    static htmlToText(html) {
      if (!html) {
        return '';
      }
      
      const $ = cheerio.load(html);
      $('script,embed,style,.embed-container,iframe').remove();
      
      return $.text().replace(/\s+/g, ' ');
    }
    
    static processFreeTextSearch(search) {
      if (!search) {
        return null;
      }

      const sanitizedSearch =  search.replace(/[-+]/g, " ").replace(/\ {1,}/g, " ");
      const searchTerms = _.map(sanitizedSearch.split(" "), (term) => {
        return `+(${term}* titleFi:${term}^10)`;
      });

      return searchTerms.join(' ');
    } 

    /**
     * Lists announcements from RSS feed
     * 
     * @param {Object} config config object
     * @param {Number} itemCount number of items to list 
     * @returns 
     */
    static async listAnnouncements(config, itemCount) {
      try {
        const feedUrl = config.get("announcements:feedUrl");
        if (!feedUrl) {
          return [];
        }

        const url = new URL(feedUrl);
        const search = new URLSearchParams(url.search);
        search.set("itemcount", itemCount);
        url.search = search.toString();

        const announcementFeed = await (new RssParser()).parseURL(url.toString());
        
        return (announcementFeed?.items || []).map(announcement => {
          return {
            id: announcement.id,
            title: announcement.title,
            link: announcement.link,
            content: Common.processPageContent('/', announcement.content),
            shortDate: moment(announcement.pubDate).format("D.M.YYYY")
          };
        });
      } catch (e) {
        console.error("Error listing announcements", e);
        return [];
      }
    }

  }

  module.exports = Common;

}).call(this);