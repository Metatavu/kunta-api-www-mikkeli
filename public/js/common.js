(function () {
  'use strict';
  
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
    $('*[data-lazy-bg-image]').each(function (index, element) {
      $(element).lazyBackgroundImage();
    });
  });
  
}).call(this);