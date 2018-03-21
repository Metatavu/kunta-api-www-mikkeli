(function() {
  'use strict';

  $('.social-share-btn').click(function(e) {
    var shareBtn = $(e.target).closest('.social-share-btn');
    var currentUrl = encodeURI(window.location.href);
    var shareUrl = shareBtn.attr('data-share-url').replace('{{url}}', currentUrl);
    window.location.href = shareUrl;
  });

  function drawImageTextWrapped(ctx, font, color, text, x, y, maxWidth, lineHeight) {
    ctx.font = font;
    ctx.fillStyle = color;
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = ctx.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, y);

    return y + lineHeight;
  }

  function createImage() {
    var titleElement = $('.story-container h2');
    var textElement = $('.story-text');

    var title = titleElement.text();
    var titleColor = titleElement.css('color');
    var titleLineHeight = parseInt(titleElement.css('line-height'));
    var titleFontSize = parseInt(titleElement.css('font-size'));
    var titleFontFamily = titleElement.css('font-family');

    var text = textElement.text();
    var textColor = textElement.css('color');
    var textLineHeight = parseInt(textElement.css('line-height'));
    var textFontSize = parseInt(textElement.css('font-size'));
    var textFontFamily = textElement.css('font-family');

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");   
    var image = document.getElementById("image");
    var logo = $('.mikkeli-logo')[0];
    var imageWidth = 625;
    var offsetLeft = 550;
    var textMarginLeft = 200;
    var textMarginRight = 200; 
    var titleTop = 180;
    var titleMarginBottom = 75;
    var logoLeft = 1500;
    var logoTop = 900;

    ctx.fillStyle = $('body').css('background-color');
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    ctx.drawImage(image, offsetLeft, 0, imageWidth, image.naturalHeight, 0, 0, imageWidth, image.naturalHeight);

    var textLeft = imageWidth + textMarginLeft;
    var textMaxWidth = canvas.width - (imageWidth + (textMarginLeft + textMarginRight));

    var textY = drawImageTextWrapped(ctx, titleFontSize + "px " + titleFontFamily, titleColor, title, textLeft, titleTop, textMaxWidth, titleLineHeight);
    drawImageTextWrapped(ctx, (textFontSize * 1.1) + "px " + textFontFamily, textColor, text, textLeft, textY + titleMarginBottom, textMaxWidth, textLineHeight * 1.3);

    ctx.drawImage(logo, logoLeft, logoTop);

    return canvas.toDataURL('image/jpeg');
  }

  $(document).on('click', '.download-image', function (event) {
    this.href = createImage();
  });
  
}).call(this);