/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const cheerio = require('cheerio');
  
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

    static processPageContent(currentPage, content) {
      if (!content) {
        return '';
      }

      const $ = cheerio.load(content);
      $('a[href]').each((index, link) => {
        var href = $(link).attr('href');
        $(link).attr('href', Common.processLink(currentPage, href));
      });

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

    static getSidebarContent(content) {
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
      return $.text().replace(/\s+/g, ' ');
    }
    
    static processFreeTextSearch(search) {
      if (!search) {
        return null;
      }
      
      const searchTerms = _.map(search.replace(/\ {1,}/g, ' ').split(' '), (term) => {
        return `+(${term}*)`;
      });
      
      return searchTerms.join(' ');
    }
  }

  module.exports = Common;

}).call(this);