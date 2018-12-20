(function () {
  'use strict';

  $.widget("custom.newsList", {
    
    _create: function() {
      this.getNews();
    },
    
    getParameters: function () {
      var tag = this.element.attr('data-tag');
      var maxResults = this.element.attr('data-max-results');
      
      return {
        tag: tag,
        maxResults: maxResults
      };
    },
    
    getNews: function () {
      $.ajax({
        url : '/ajax/newsByTag',
        data: this.getParameters(),
        success : $.proxy(function(news) {
          var row = $('<div>').addClass('row').appendTo(this.element);
          for (var i = 0; i < news.length; i++) {
            var article = news[i];
            this.appendArticle(row, article);
          }
        }, this)
      });
    },
    
    appendArticle: function (row, article) {        
      var imageSrc = '/newsArticleImages/' + article.id + '/' + article.imageId;
      
      row.append(
        $('<div/>', {'class': 'news-article thumb-article'}).append(
          $('<div/>', {'class': 'news-article-image'})
            .attr('data-lazy-bg-image', imageSrc)
        )
        .append(
          $('<div/>', {'class': 'details'}).append(
            $('<div/>', {'class': 'date'}).append(
              $('<span/>', {'text': moment(article.published).format("D.M.YYYY")})
            )
          )
          .append(
            $('<div/>', {'class': 'title'}).append(
              $('<a/>', {'href': '/uutiset/' + article.slug}).append(
                $('<span/>', {'html': article.title})
              )
            )
          )
        )
      );
      row.find('*[data-lazy-bg-image]').lazyBackgroundImage();
    }
  });
  
  $(document).ready(function () {
    $('.kunta-api-news-list').newsList();
  });
  
}).call(this);