(function() {
  'use strict';

  $('.social-share-btn').click(function(e) {
    var shareBtn = $(e.target).closest('.social-share-btn');
    var currentUrl = encodeURI(window.location.href);
    var shareUrl = shareBtn.attr('data-share-url').replace('{{url}}', currentUrl);
    window.location.href = shareUrl;
    
  });
  
}).call(this);