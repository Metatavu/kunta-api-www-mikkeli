/* global  */

(function () {
  'use strict';
  
 $.widget("custom.timetableCreator", {
    
    options: {
    },
    
    _create : function() {
      this.element.find('.stop-select').chosen({width: "100%"});
      this.element.on('change', '.stop-select', $.proxy(this._onStopSelectChange, this));
      this._updateLink();
    },
    
    _getStopIds: function () {
      return this.element.find('.stop-select').val();
    },
    
    _updateLink: function () {
      var stopIds = this._getStopIds();
      if (stopIds.length > 0) {
        var query = $.map(stopIds, function (stopId) {
          return 'stopId=' + stopId;
        }).join('&');
        
        var link = window.location.protocol + '//' + window.location.host + '/timetable?' + query;
        
        this.element.find('.timetable-link')
          .attr('href', link)
          .text(link);
      } else {
        this.element.find('.timetable-link')
          .attr('href', '#')
          .text('Valitse pysäkit'); 
      }
    },
    
    _onStopSelectChange: function ()  {
      this._updateLink();
    }
    
 });
  
  
  $(document).ready(function () {
    $(document).timetableCreator();
  });
  
})();