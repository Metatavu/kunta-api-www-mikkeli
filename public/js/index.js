(function() {
  'use strict';

  $(document).ready(function () {
    
    $('.social-media-items').masonry({
      itemSelector: '.social-media-item',
      columnWidth: '.social-media-items-grid-sizer',
      percentPosition: true
    });
    
  });

}).call(this);