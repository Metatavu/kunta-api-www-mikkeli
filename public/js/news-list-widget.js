/* global $, moment */

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
      const displayFormat = this.element.hasClass("kunta-api-news-list-text") ? "text" : "thumb";

      $.ajax({
        url : '/ajax/newsByTag',
        data: this.getParameters(),
        success : $.proxy(function(news) {
          var row = $('<div>').addClass('row').appendTo(this.element);
          for (var i = 0; i < news.length; i++) {
            var article = news[i];
            if (displayFormat == "text") {
              this.appendTextArticle(row, article);
            } else {
              this.appendThumbArticle(row, article);
            }
          }
        }, this)
      });
    },

    /**
     * Appends article when using thumb display stategy
     */
    appendTextArticle: function (row, article) {
      const result = $("<div>").addClass("news-article text-article");
      const date = $("<div>").addClass("date").text(moment(article.published).format("D.M.YYYY"));
      const title = $("<div>").addClass("title");
      const titleLink = $("<a>").attr("href", "/uutiset/" + article.slug).text(article.title);

      result.append(date);
      result.append(title.append(titleLink));

      row.append(result);
      row.find("*[data-lazy-bg-image]").lazyBackgroundImage();
    },
    
    /**
     * Appends article when using thumb display stategy
     */
    appendThumbArticle: function (row, article) {
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