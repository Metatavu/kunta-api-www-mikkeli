(function () {
  'use strict';

  $(document).ready(function () {

    new Swiper('.swiper-container', {
      pagination: '.swiper-pagination',
      nextButton: '.swiper-button-next',
      prevButton: '.swiper-button-prev',
      paginationClickable: true,
      slidesPerView: 'auto',
      centeredSlides: true,
      autoplay: 2500,
      autoplayDisableOnInteraction: false
    });

    $('.social-media-items').css('opacity', '0');

    $('.social-media-items').imagesLoaded(function () {
      $('.social-media-items')
        .css('opacity', '1')
        .masonry({
          itemSelector: '.social-media-item',
          columnWidth: '.social-media-items-grid-sizer',
          percentPosition: true
        });
    });

  });
}).call(this);