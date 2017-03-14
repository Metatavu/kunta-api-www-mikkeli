/* global L, moment */

(function () {
  'use strict';
  
  var colors = [{
      name: 'orange',
      hex: '#f69730'
    }, {
      name: 'blue',
      hex: '#38aadd'
    }, {
      name: 'purple',
      hex: '#d252b9'
    }, {
      name: 'darkred',
      hex: '#a23336'
    }, {
      name: 'darkblue',
      hex: '#0067a3'
    }, {
      name: 'darkgreen',
      hex: '#728224'
    },  {
      name: 'darkpurple',
      hex: '#5b396b'
    }, {
      name: 'cadetblue',
      hex: '#436978'
    }, {
      name: 'green',
      hex: '#72b026'
    }, {
      name: 'red',
      hex: '#d63e2a'
    }
  ];
  
  var map = new L.Map("map", {
      center: new L.LatLng(61.688727, 27.272146),
      zoom: 12,
      maxZoom: 17
  });
  
  map.addLayer(new L.StamenTileLayer("toner"));
  
  var stops = JSON.parse($('#stops-json').val());
  var stopIndex = 0;
  var stopMarkers = [];
  for (var stopId in stops) {
    if (stops.hasOwnProperty((stopId))) {
      var stop = stops[stopId];
      stop.color = colors[stopIndex % colors.length];
      
      var marker = L.marker([stop.lat, stop.lng], {
        icon: L.AwesomeMarkers.icon({
          icon: 'bus',
          markerColor: stop.color.name,
          prefix: 'fa'
        })
      }).addTo(map);
      
      stopMarkers.push(marker);
      stopIndex++;
    }
  }

  setInterval(function (){
    $('.current-time').text(moment().format('HH:mm'));
    updateTimetableRows();
  }, 1000);
  
  updateTimeTable();
  
  setInterval(function (){
    updateTimeTable();
  }, 1000 * 60 * 60);
  
  function updateTimeTable() {
    map.fitBounds(new L.featureGroup(stopMarkers).getBounds());
    
    $.ajax({
      url: getTimetableUrl(),
      dataType: 'html',
      success: function(html) {
        $('.timetable-container').html(html);
        
        $('td[data-stop-id]').each(function() {
          $(this).css('color', stops[$(this).attr('data-stop-id')].color.hex);
        });
  
        $('td[data-departure-time]').each(function() {
          var secondsFromMidnight = $(this).attr('data-departure-time');
          $(this).text(secondsFromMidnightToHumanReadable(secondsFromMidnight));
        });
      }
    });
  }
  
  function getTimetableUrl() {
    var url = '/ajax/timetable?departureTime='+getCurrentSecondsFromMidnight();
    for (var stopId in stops) {
      if (stops.hasOwnProperty((stopId))) {
        url += '&stopId=' + stopId;
      }
    }
    
    return url;
  }
  
  function updateTimetableRows() {
    $('td[data-departure-time]').each(function() {
      var secondsFromMidnight = parseInt($(this).attr('data-departure-time'), 10);
      var currentSecondsFromMidnight = getCurrentSecondsFromMidnight();
      if (currentSecondsFromMidnight > secondsFromMidnight) {
        $(this).parents('tr').remove();
      }
    });
  }
  
  function secondsFromMidnightToHumanReadable(secondsFromMidnigt) {
    var seconds = parseInt(secondsFromMidnigt, 10) % (60 * 60 * 24);
    var hours = Math.floor(seconds / 3600);
    seconds = seconds - hours * 3600;
    var minutes = seconds / 60;
    return moment(hours + ':' + minutes, 'H:m').format('HH:mm');
  }
  
  function getCurrentSecondsFromMidnight() {
    var now = moment();
    var secondsFromMidnight = now.hour() * 3600;
    secondsFromMidnight += now.minute() * 60;
    secondsFromMidnight += now.second();
    return secondsFromMidnight;
  }
  
})();