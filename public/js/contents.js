/* jshint esversion:6 */
/* global $, document */

(function () {
  'use strict';
  
  $.widget("custom.contentsNav", {
    
    options: {
      rootPath: null  
    },
    
    _create : function() {
      $(document).on('click', '.page-nav .page-nav-item .open-folder', $.proxy(this._onOpenFolderClick, this));
      this._resolvePaths(document);
    },
    
    _resolvePaths: function (container) {
      $(container).find('.page-nav-link').each($.proxy(function (index, link) {
        $(link).attr('href', this.options.rootPath + '/' + this._resolvePath(link));
      }, this));
    },
    
    _loadItems: function (path, pageId, callback) {
      $.ajax('/ajax/pagenav?pageId=' + pageId, {
        success: $.proxy(function (html) {
          callback(null, html);
        }, this),
        error: $.proxy(function (jqXHR, textStatus) {
          callback(textStatus);
        }, this)
      });
    },
    
    _resolvePath: function (link) {
      var slugs = [];
      
      $(link).parents('.page-nav-item').each(function (index, item) {
        slugs.unshift($(item).find('[data-slug]').attr('data-slug'));
      });
      
      return slugs.join('/');
    },
    
    _onOpenFolderClick: function (event) {
      event.preventDefault();
      var openLink = $(event.target);
      var item = openLink.closest('.page-nav-item');
      if (item.hasClass('open')) {
        item.addClass('closed').removeClass('open');
        return;
      }
      
      if (item.hasClass('closed')) {
        item.addClass('open').removeClass('closed');
        return;
      }
      
      item.addClass('loading');

      var path = openLink.attr('data-path');
      var pageId = openLink.attr('data-page-id');
      this._loadItems(path, pageId, $.proxy(function (err, html) {
        if (err) {
          console.error(err);
        } else {
          item.addClass('open')
            .removeClass('loading')
            .find('.child-pages')
            .html(html);
          this._resolvePaths(item);
        }
      }, this));
    }

  });
  
  $.widget("custom.casemHistoryTopic", {
    
    _create : function() {
      this.element.on('click', '> h3', $.proxy(this._onHeaderClick, this));
      this.element.find('.casem-history-topic-contents').hide();
      this.element.find('> h3').text('Näytä aikaisempi käsittely');
    },
    
    _onHeaderClick: function (event) {
      event.preventDefault();
      this.element.toggleClass('open');
      this.element.find('.casem-history-topic-contents').slideToggle();
    }
  
  });
  
  $.widget("custom.contactSearch", {
    
    _create : function() {
      this._page = 0;
      this._lastSearch = null;
      this.element.append($("<label>").text(this.element.attr("data-placeholder")).attr("for", this.element.attr("data-placeholder")));
      this.element.append($("<input>").addClass('contact-search form-control m-t-1').attr('placeholder', this.element.attr('data-placeholder')).attr("id", this.element.attr("data-placeholder")).attr("title", this.element.attr("data-placeholder")));
      this.element.append($("<div>").addClass('contact-search-results'));
      this.element.on('click', '.pages-container a.page-prev', $.proxy(this._onPagePrevClick, this));
      this.element.on('click', '.pages-container a.page-next', $.proxy(this._onPageNextClick, this));
      this.element.on("keyup", 'input.contact-search', $.proxy(this._onInputKeyUp, this));
      this._search();
    },
    
    _getSearch: function () {
      return $.trim(this.element.find('input.contact-search').val());
    },
    
    _search: function () {
      var search = this._getSearch();
      
      this._lastSearch = search;
      if (!this._searching) {
        this._searching = true;
        this.element.addClass('searching');
        this.element.find('.contact-search-results').empty();
      
        $.ajax({
          url : '/ajax/contactSearch/?page=' + this._page,
          data : {
            search: search
          },
          success : $.proxy(function(data) {
            this._searching = false;
            this.element
              .find('.contact-search-results')
              .html(data)
              .show();

            if (search !== this._getSearch()) {
              this._search();
            } else {
              this.element.removeClass('searching');
            }
          }, this)
        });
      }
    },
    
    _onInputKeyUp: function (event) {
      if (this._lastSearch !== this._getSearch()) {
        this._page = 0;
        this._search();
      }
    },
    
    _onPagePrevClick: function (event) {
      event.preventDefault();
      this._page = $(event.target).attr('data-page');
      this._search();
    },
    
    _onPageNextClick: function (event) {
      event.preventDefault();
      this._page = $(event.target).attr('data-page');
      this._search();
    }
  
  });

  $.widget("custom.accessibilityContainer", {
     
    _create : function() {
      this.element.on("click", "button" , $.proxy(this._onTitleClick, this));
      const buttonText = this.element.children("b").first().text();
      this.element.children("b").first().replaceWith("<button type='button'>");
      this.element.children("button").first().addClass("button-text").text(buttonText);
      this.element.children("button").first().addClass("closed");
      this.element.children("p").wrapAll("<ul/>")
      this.element.children("ul").first().children("p").replaceWith(function(i, content) {
      return "<li>" + content + "</li>" ;
      });
      this.element.children("ul").first().addClass("hidden");
    },
    
    _onTitleClick: function (event) {
      event.preventDefault();
      if (this.element.children("button").first().hasClass("closed")) {
        this.element.children("button").first().addClass("open").removeClass("closed");
        this.element.children("ul").first().removeClass("hidden");
      } else {
        this.element.children("button").first().addClass("closed").removeClass("open");
        this.element.children("ul").first().addClass("hidden");
      }

    }
  
  });
  
  $(document).ready(function () {
    $(document.body).contentsNav({
      rootPath: $('.rootPath').val()
    });
    
    $('.casem-history-topic').casemHistoryTopic();
    $('.kunta-api-contact-search').contactSearch();

    var accessibilitySentences = $(".accessibility-sentences");
    accessibilitySentences.prepend("<p class='p-info'>Klikkaa nuolta avataksesi lisätietokentän</p>");
    $( ".accessibility-sentence" ).accessibilityContainer();

    $("img.lazy").lazyload();

  });
  
}).call(this);