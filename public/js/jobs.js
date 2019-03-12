/*jshint esversion: 5 */
/* global moment */

(function () {
  'use strict';

  /**
   * Widget for embedded jobs
   */
  $.widget("custom.jobs", {
    
    /**
     * Constructor
     */
    _create: function() {
      $.ajax({
        url : '/jobs',
        data: {
          limit: this.element.attr('data-limit'),
          sortBy: this.element.attr('data-sort-by'),
          sortDir: this.element.attr('data-sort-dir')
        },
        success: $.proxy(function(data) {
          this._renderJobs(data[0]);
        }, this)
      });
    },
    
    /** 
     * Renders job list 
     */
    _renderJobs: function (jobs) {
      for (var i = 0; i < jobs.length; i++) {
        var jobPublished = moment(jobs[i].publicationStart).format('DD.MM.YYYY');

        var header = $("<a>").attr({
          "href": jobs[i].link,
          "target": "_blank"
        }).append($("<h6>").text(jobs[i].title));

        var pubished = $("<small>").text("Ilmoitus jätetty " + jobPublished);

        var description = $("<p>")
          .html(this._truncateString(jobs[i].description))
          .append("<br/>")
          .append(pubished);

        this.element.append(header);
        this.element.append(description);
      }
    },
    
    /**
     * Truncates string to maximum 150 characters
     * 
     * @param {String} string orignal string
     * @return {String} truncated string
     */
    _truncateString: function (string) {
      var stringLength = 150;
      return string.substring(0, stringLength) + '...';
    }
    
  });
  
  $(document).ready(function () {
    $('.kunta-api-job-list').jobs();
  });
  
}).call(this);