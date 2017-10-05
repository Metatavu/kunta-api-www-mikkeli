(function () {
  'use strict';
  
  function fitTiles() {
    $('.tile h3').bigtext({
      maxfontsize: 28
    });

    $('.tile .details').each(function (index, detailsElement) {
      var detailsHeight = $(detailsElement).height() - parseInt($(detailsElement).css('padding-top'));
      var h3Height = $(detailsElement).find('h3').height();
      var textHeight = detailsHeight - h3Height; 
      var textElement = $(detailsElement).find('.tile-text');
      var fontSize = parseFloat(textElement.css('font-size'));
      var step = 0.05;
      
      while (fontSize > 1 && textElement.outerHeight(true) > textHeight) {
        fontSize -= step;
        $(detailsElement).find('.tile-text p').css('font-size', fontSize + 'px');        
      }
    });

    $('.tile .details').css('visibility', 'visible');
  }
  
  $(window).resize(function () {
    $('.tile .details').css('visibility', 'hidden');
    $('.tile .tile-text p').css('font-size', 'initial');
    fitTiles();
  });

  $(document).ready(function () {
    fitTiles();
    
    new Swiper('.swiper-container', {
      pagination: '.swiper-pagination',
      nextButton: '.swiper-button-next',
      prevButton: '.swiper-button-prev',
      paginationClickable: true,
      slidesPerView: 3,
      initialSlide: 1,
      centeredSlides: true,
      autoplay: 2500,
      autoplayDisableOnInteraction: false,
      breakpoints: {
        991: {
          slidesPerView: 1,
          initialSlide: 0
        }
      }
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