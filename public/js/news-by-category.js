(function () {
  'use strict';

  $.widget("custom.newsByCategory", {
    
    _create: function() {
      this.getNews();
    },
    
    getParameters: function () {
      var category = $('.kunta-api-news-by-category').attr('data-category');
      var maxResults = $('.kunta-api-news-by-category').attr('data-max-results');
      
      return {
        category: category,
        maxResults: maxResults
      };
    },
    
    getNews: function () {
      $.ajax({
        url : '/ajax/newsByTag',
        data: this.getParameters(),
        success : $.proxy(function(data) {
          this.appendNews(data);
        }, this)
      });
    },
    
    appendNews: function (news) {
      for (var i = 0; i < news.length; i++) {
        var article = news[i];
        var imageSrc = '/newsArticleImages/' + article.id + '/' + article.imageId;

        $('.kunta-api-news-by-category > .row').append(
            $('<div/>', {'class': 'news-article thumb-article'}).append(
                $('<div/>', {'class': 'news-article-image'})
            )
            .append(
                $('<div/>', {'class': 'details'}).append(
                    $('<div/>', {'class': 'date'}).append(
                      $('<span/>', {'text': moment(article.published).format("D.M.YYYY")})
                    )
                )
                .append(
                  $('<div/>', {'class': 'title'}).append(
                    $('<a/>', {'id': 'news-article-link-' + i, 'href': '/uutiset/' + article.slug}).append(
                      $('<span/>', {'text': article.title})
                    )
                  )
                )
            )
        );
        $('.news-article-image').attr('data-lazy-bg-image', imageSrc);
      }

      $('*[data-lazy-bg-image]').each(function (index, element) {
        $(element).lazyBackgroundImage();
      });
    }
  });
  
  $.widget("custom.lazyBackgroundImage", {
    
    _create : function() {
      this._preloaderImage = new Image();
      this._preloaderImage.onload = $.proxy(this._onPreloadImageLoad, this);
      this._preloaderImage.src = this._resolveUrl();
    },
    
    _resolveSize: function () {
      var imageSizeAttr = this.element.attr('data-lazy-bg-size');
      if (imageSizeAttr) {
        if ($.isNumeric(imageSizeAttr)) {
          return parseInt(imageSizeAttr);
        } else {
          return Math.round(Math.max($(imageSizeAttr).width(), $(imageSizeAttr).height()));
        }
      }
      
      return Math.round(Math.max(this.element.width(), this.element.height()));
    },
  
    _resolveUrl: function () {
      return this.element.attr('data-lazy-bg-image') + '?size=' + this._resolveSize();
    },
    
    _onPreloadImageLoad: function () {
      this.element.css({
        'background-image': 'url(' + this._preloaderImage.src + ')'
      })
      .removeAttr('data-lazy-bg-image');
    }
  });
  
  $(document).ready(function () {
    $('.kunta-api-news-by-category').newsByCategory();
  });
  
}).call(this);