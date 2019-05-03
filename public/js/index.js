/* global $, document */

(function () {
  'use strict';

  $(document).ready(function () {
    var mySwiper = new Swiper(".swiper-container", {
      pagination: ".swiper-pagination",
      nextButton: ".swiper-button-next",
      prevButton: ".swiper-button-prev",
      paginationClickable: true,
      slidesPerView: 3,
      initialSlide: 1,
      centeredSlides: true,
      autoplay: 2500,
      autoplayDisableOnInteraction: true,
      breakpoints: {
        991: {
          slidesPerView: 1,
          initialSlide: 0
        }
      }
    });

    $(".event-link").focus(function () {
      mySwiper.stopAutoplay();
    });

    $(".slide-play").click(function () {
      mySwiper.startAutoplay();
    });

    $(".slide-pause").click(function () {
      mySwiper.stopAutoplay();
    });

    $(document).keydown(function (e) {
      switch (e.which) {
        case 37:
          mySwiper.slidePrev();
          break;
        case 39:
          mySwiper.slideNext();
          break;
        default: return;
      }
      e.preventDefault();
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