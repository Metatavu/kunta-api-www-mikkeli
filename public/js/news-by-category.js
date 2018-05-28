(function () {
  'use strict';

  $(document).ready(function () { 
    if ($('.kunta-api-news-by-category').length) {
      var category = checkAttribute('category');
      var news = getNewsByCategory('Yleinen');   
      appendNews(news);
    }
    
    function appendNews (news) {
      
    }
    
    function getNewsByCategory(category) {
      $.get("/ajax/newsByTag/" + category + "?maxResults=3", function(results) {
        console.log(results);
        for (var i = 0; i < results.length; i++) {
          var article = results[i];
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
                      $('<a/>', {'id': 'news-article-link-' + i}).append(
                        $('<span/>', {'text': article.title})
                      )
                    )
                  )
              )
          );
          $('.news-article-image').attr('data-lazy-bg-image', imageSrc);
          $('.news-article-link-' + i).attr('href', '/uutiset/' + article.slug);
        }
        
        $('*[data-lazy-bg-image]').each(function (index, element) {
          $(element).lazyBackgroundImage();
        });
      });
    }
    
    function checkAttribute (attributeName) {
      var attribute = $('.kunta-api-news-by-category').attr(attributeName);

      if (typeof attribute !== typeof undefined && attribute !== false) {
        return attribute;
      } else {
        return null;
      }
    };
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
  
}).call(this);