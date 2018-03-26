(function() {
  'use strict';

  $('.social-share-btn').click(function(e) {
    var shareBtn = $(e.target).closest('.social-share-btn');
    var currentUrl = encodeURI(window.location.href);
    var shareUrl = shareBtn.attr('data-share-url').replace('{{url}}', currentUrl);
    window.location.href = shareUrl;
  });

  function setMetaformPage(metaform, pageParam) {
    var pageInput = $(metaform).find('input[name="page"]');
    var max = parseInt(metaform.find('input[name="page-count"]').val());
    var page = Math.min(Math.max((parseInt(pageParam) || 0), 0), max);
    pageInput.val(page).change();
    metaform.closest('.metaform-container').find('.metaform-page').text(page);
    if (page === 0) {
      $('.metaform-pages-container').hide();
    } else {
      $('.metaform-pages-container').show();
    }
  }

  function getMetaformPage(metaform) {
    return parseInt($(metaform).find('input[name="page"]').val()) || 0;
  }

  function getMetaformPageCount(metaform) {
    return parseInt($(metaform).find('input[name="page-count"]').val()) || 0;
  }
  
  function saveMetaformReply(metaform, cb) {
    var valuesArray = $(metaform).metaform('val', true); 
    var id = $(metaform).closest('.metaform-container').attr('data-id');
    var values = {};

    for (var i = 0; i < valuesArray.length; i++) {
      var name = valuesArray[i].name;
      if (name !== 'page' && name !== 'page-count') {
        var value = valuesArray[i].value;
        values[name] = value;
      }
    }

    $.post('/ajax/metaform', {id: id, data: values}, function(res) {
      cb(res, values);
    });
  }

  function checkDisabled() {
    if ($('.metaform-paged section:visible .form-check-input').is(':checked')) {
      $('.metaform-next').removeClass('disabled');
    } else {
      $('.metaform-next').addClass('disabled');
    }
  }
  
  function changeMetaformPage(metaform, delta) {
    var id = $(metaform).closest('.metaform-container').attr('data-id');
    $(metaform).metaform('option', 'animation.hide.options.direction', delta > 0 ? 'left' : 'right');
    $(metaform).metaform('option', 'animation.show.options.direction', delta > 0 ? 'right' : 'left');
    var page = getMetaformPage(metaform) + delta;
    if (page > getMetaformPageCount($(metaform))) {
      $('.loading-screen').show();
      saveMetaformReply(metaform, function(res, values) {
        window.location.href = '/mikkelin-tarina?q=' + encodeURIComponent(btoa(JSON.stringify(values)));
      });
    } else {
      setMetaformPage(metaform, page);
    }

  }
  
  function createPagedMetaform(metaform) {
    var pageCount = getMetaformPageCount(metaform);
    var pages = $('<div class="row"><div class="col text-center"><div class="metaform-pages-container"><span class="metaform-page">1</span><span>/</span><span class="metaform-pages">' + pageCount + '</span></div></div></div>');
    var navigation = $('<div class="row next-prev-button-container"><div class="col text-right"><a class="metaform-prev" href="#"><i class="fa fa-chevron-left" aria-hidden="true"></i></a></div><div class="col text-left"><a class="metaform-next" href="#"><i class="fa fa-chevron-right" aria-hidden="true"></i></a></div></div><input type="hidden" name="page-count" value="' + pageCount + '"/>');
    
    metaform.closest('.metaform-container')
      .prepend(pages)
      .append(navigation);

    var valuesArray = metaform.metaform('val', true);
    for (var i = 0; i < valuesArray.length; i++) {
      var name = valuesArray[i].name;
      if (name === 'page') {
        var value = valuesArray[i].value;
        setMetaformPage(metaform, value);
      }
    }
    
    $(metaform).metaform('option', 'animation', {
      framework: 'jquery-ui',
      hide: {
        effect: 'slide',
        duration: 400,
        options: {
          direction: 'left'
        }
      },
      show: {
        effect: 'slide',
        duration: 400,
        options: {
          direction: 'right'
        }
      }
    });

    $(document).on('change', 'input[type="radio"]', function (event) {
      event.preventDefault();

      var currentSection = $('.metaform-paged section:visible');
      var radios = $(currentSection).find('input[type="radio"]');
      var hasEmptyRadios = radios.length > 0 ? radios.find(':checked').length > 0 : false;
      var inputs = $(currentSection).find('input[type="text"],textarea');
      var hasEmptyInputs = inputs.length > 0 ? !inputs.val() : false;

      if (!hasEmptyInputs && !hasEmptyRadios) {
        $('body').css('height', $('body').height() + 'px');
        $('.metaform-next, .metaform-prev').hide();
        var input = $(event.target);
        var metaform = input.closest('.metaform');
        changeMetaformPage(metaform, 1);
      }

      checkDisabled();
    });
  }

  $(document).on('metaformcreate', function (event, ui) {
    var metaform = $(event.target);

    if (metaform.closest('.metaform-paged').length) {
      createPagedMetaform(metaform);
    }

    if (metaform.closest('.mikkelintarina-contact').length) {
      $(metaform).find('input[name="phase"]').val('form').change();
    }
  });
  
  $(document).on('click', '.metaform-next,.start-query-btn', function (event) {
    event.preventDefault();
    var link = $(event.target);
    if (link.closest('.disabled').length === 0) {
      $('body').css('height', $('body').height() + 'px');
      $('.metaform-next,.metaform-prev').hide();
      changeMetaformPage(link.closest('.metaform-container').find('.metaform'), +1);
    }
  });

  $(document).on('click', '.metaform-prev', function (event) {
    event.preventDefault();
    $('body').css('height', $('body').height() + 'px');
    $('.metaform-next,.metaform-prev').hide();
    var link = $(event.target);
    changeMetaformPage(link.closest('.metaform-container').find('.metaform'), -1);
  });
  
  $('.metaform-container').on('afterShow', function() {
    $('body').css('height', 'auto');
    if (getMetaformPage($('.metaform-container')) > 0) {
      $('.metaform-next,.metaform-prev').show();
    }

    checkDisabled();
  });
  
  $(document).ready(function () {    
    $('.metaform-container').each(function (index, metaformElement) {
      var viewModel = JSON.parse($(metaformElement).attr('data-view-model') || '{}');
      var formValues = JSON.parse($(metaformElement).attr('data-form-values') || '{}');
      var html = mfRender({
        viewModel: viewModel,
        formValues: formValues
      });

      $(metaformElement)
        .html(html)
        .find('.metaform')
        .metaform();     
    });
  });

  $(document).on("click", '.mikkelintarina-contact input[type="submit"]', function (e) {
    var metaform = $(e.target).closest('.metaform-container').find('.metaform');
    var valid = typeof metaform[0].checkValidity === 'function' ? metaform[0].checkValidity() : true;    
    if (valid) {
      $(metaform)
        .find('input[type="submit"]')
        .replaceWith($('<h4 style="display:inline;padding-left:15px;">Tallennetaan <i class="fa fa-spin fa-spinner"/></h4>'));
        
      e.preventDefault();
      
      saveMetaformReply(metaform, function(res, values) {
        $(metaform).find('input[name="phase"]').val('result').change();
      });  
    }

  });

  
}).call(this);