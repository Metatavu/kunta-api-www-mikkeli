/* global async */

(function () {
  'use strict';
  
  $.widget("custom.search", {
    
    _create : function() {
      this._searching = false;
      this.element.on('click', 'input[name="search"]', $.proxy(this._onSearchClick, this));
      this.element.on('keyup', 'input[name="query"]', $.proxy(this._onSearchKeyDown, this));
      this.element.on('click', '#pages-tab a.page-prev', $.proxy(this._onPagesPrevPageClick, this));
      this.element.on('click', '#pages-tab a.page-next', $.proxy(this._onPagesNextPageClick, this));
      this.element.on('click', '#files-tab a.page-prev', $.proxy(this._onFilesPrevPageClick, this));
      this.element.on('click', '#files-tab a.page-next', $.proxy(this._onFilesNextPageClick, this));
      
      this._search();
    },
    
    _handleError: function (err) {
      alert(err);
    },
    
    _searchPages: function (page, callback) {
      var search = this._getSearch();
      
      $.ajax({
        url : '/ajax/search/pages',
        data : {
          search: search,
          page: page
        },
        success : function(data) {
          callback(null, data); 
        },
        error: function (jqXHR, textStatus) {
          callback(jqXHR.responseText || jqXHR.statusText || textStatus || 'error');
        }
      });
    },
    
    _searchFiles: function (page, callback) {
      var search = this._getSearch();
      
      $.ajax({
        url : '/ajax/search/files',
        data : {
          search: search,
          page: page
        },
        success : function(data) {
          callback(null, data); 
        },
        error: function (jqXHR, textStatus) {
          callback(jqXHR.responseText || jqXHR.statusText || textStatus || 'error');
        }
      });
    },
    
    _createPageSearch: function (page) {
      return $.proxy(function (callback) {
        this._searchPages(page, callback);
      }, this);
    },
    
    _createFileSearch: function () {
      var search = this._getSearch();
      return function (callback) {
        $.ajax({
          url : '/ajax/search/files',
          data : {
            search: search
          },
          success : function(data) {
            callback(null, data); 
          },
          error: function (jqXHR, textStatus) {
            callback(jqXHR.responseText || jqXHR.statusText || textStatus || 'error');
          }
        });
      };
    },
    
    _createNewsSearch: function () {
      var search = this._getSearch();
      return function (callback) {
        $.ajax({
          url : '/ajax/search/news',
          data : {
            search: search
          },
          success : function(data) {
            callback(null, data); 
          },
          error: function (jqXHR, textStatus) {
            callback(jqXHR.responseText || jqXHR.statusText || textStatus || 'error');
          }
        });
      };
    },
    
    _search: function () {
      var search = this._getSearch();
      if (search) {
        if (!this._searching) {
          this._searching = true;
          
          this.element
            .find('.search-results-container')
            .hide();

          this.element
            .find('.search-hint-container')
            .hide();
    
          this.element
            .find('.results-container')
            .addClass('searching');
    
          var searches = [ 
            this._createPageSearch(0), 
            this._createFileSearch(0), 
            this._createNewsSearch(0) 
          ];

          async.parallel(searches, $.proxy(function(err, results) {
            this._searching = false;
            if (err) {
              this._handleError(err); 
            } else {
              this.element.find('.results-container').removeClass('searching');
              this.element.find('.search-results-container').show();

              var pages = results[0]; 
              var files = results[1]; 
              var news = results[2];
    
              this.element.find('#pages-tab').html(pages);
              this.element.find('#files-tab').html(files);
              this.element.find('#news-tab').html(news);
              
              var activeTab = this.element
                .find('.nav-link.active')
                .attr('href');
              
              this.element.find(activeTab).tab('show');
            }
          }, this));

        }
      } else {
        this.element
          .find('.search-results-container')
          .hide();
    
        this.element
          .find('.search-hint-container')
          .show();
      }
    },
    
    _loadPages: function (page) {
      var height = this.element
        .find('#pages-tab')
        .height();
      
      this.element
        .find('#pages-tab')
        .empty()
        .css('height', height)
        .addClass('searching');
      
      this._searchPages(page, $.proxy(function (err, pages) {
        if (err) {
          this._handleError(err); 
        } else {
          this.element.find('#pages-tab')
            .css('height', 'auto')
            .removeClass('searching')
            .html(pages);
        }
      }, this));
    },
    
    _loadFiles: function (page) {
      var height = this.element
        .find('#files-tab')
        .height();
      
      this.element
        .find('#files-tab')
        .empty()
        .css('height', height)
        .addClass('searching');
      
      this._searchFiles(page, $.proxy(function (err, files) {
        if (err) {
          this._handleError(err); 
        } else {
          this.element.find('#files-tab')
            .css('height', 'auto')
            .removeClass('searching')
            .html(files);
        }
      }, this));
    },
    
    _getSearch()  {
      return this.element.find('input[name="query"]').val(); 
    },
    
    _onSearchClick: function (event) {
      event.preventDefault();
      this._search();
    },
    
    _onSearchKeyDown: function (event) {
      if (event.which === 13) {
        event.preventDefault();
        this._search();
      }
    },
    
    _onPagesPrevPageClick: function (event) {
      event.preventDefault();
      
      var href = $(event.target).attr('href');
      if (href.startsWith('#p')) {
        this._loadPages(parseInt(href.substring(2)));
      }
    },
    
    _onPagesNextPageClick: function (event) {
      event.preventDefault();
      
      var href = $(event.target).attr('href');
      if (href.startsWith('#p')) {
        this._loadPages(parseInt(href.substring(2)));
      }
    },

    _onFilesPrevPageClick: function (event) {
      event.preventDefault();
      
      var href = $(event.target).attr('href');
      if (href.startsWith('#p')) {
        this._loadFiles(parseInt(href.substring(2)));
      }
    },
    
    _onFilesNextPageClick: function (event) {
      event.preventDefault();
      
      var href = $(event.target).attr('href');
      if (href.startsWith('#p')) {
        this._loadFiles(parseInt(href.substring(2)));
      }
    }
  
  });
  
  $(document).ready(function () {
    $(document.body).search();
  });
  
}).call(this);