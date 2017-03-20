/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const cheerio = require('cheerio');
  
  class Common {
    
    static get CONTENT_FOLDER() { 
      return '/sisalto' 
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
      return 5;
    }
    
    static get ANNOUNCEMENT_COUNT_PAGE() { 
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

    static processPageContent(currentPage, content) {
      if (!content) {
        return '';
      }

      const $ = cheerio.load(content);

      $('a[href]').each((index, link) => {
        var href = $(link).attr('href');
        $(link).attr('href', Common.processLink(currentPage, href));
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
  }

  module.exports = Common;

}).call(this);