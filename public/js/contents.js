(function () {
  'use strict';
  
  $.widget("custom.contentsNav", {
    
    _create : function() {
      $(document).on('click', '.page-nav .page-nav-item .open-folder', $.proxy(this._onOpenFolderClick, this));
    },
    
    _loadItems: function (pageId, callback) {
      $.ajax('/ajax/pagenav?pageId=' + pageId, {
        success: $.proxy(function (html) {
          callback(null, html);
        }, this),
        error: $.proxy(function (jqXHR, textStatus) {
          callback(textStatus);
        }, this)
      });
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

      var pageId = openLink.attr('data-page-id');
      this._loadItems(pageId, function (err, html) {
        if (err) {
          console.error(err);
        } else {
          item.addClass('open')
            .removeClass('loading')
            .find('.child-pages')
            .html(html);
        }
      });
    }

  });

  $(document).ready(function () {
    $(document.body)
      .contentsNav();
  });
  
}).call(this);