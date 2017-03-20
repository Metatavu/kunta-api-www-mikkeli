/*jshint esversion: 6 */
(function() {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');

  module.exports = (app, config, ModulesClass) => {

    app.get('/timetable', (req, res) => {
      var stopIds = req.query.stopId;
      if (!Array.isArray(stopIds)) {
        stopIds = [ stopIds ];
      }
      
      new ModulesClass(config)
        .publicTransport.findStopsByIds(stopIds)
        .callback((data) => {
          var stopMap = _.keyBy(data[0], 'id');
          res.render('pages/timetable.pug', {
            stops: stopMap
          });
        });
    });
    
    app.get('/timetable/create', (req, res) => {
      new ModulesClass(config)
        .publicTransport.listStops()
        .callback((data) => {
          res.render('pages/timetable-create.pug', {
            stops: data[0]
          });
        });
    });
    
    app.get('/ajax/timetable', (req, res) => {
      var stopIds = req.query.stopId;
      var departureTime = req.query.departureTime;
      if (!Array.isArray(stopIds)) {
        stopIds = [ stopIds ];
      }
      
      new ModulesClass(config)
        .publicTransport.listActiveStopTimesByStopIdsAndDepartureTimeAndDate(stopIds, departureTime, moment(), 'DEPARTURE_TIME', 'ASC', 0, 1000)
        .publicTransport.listActiveStopTimesByStopIdsAndDepartureTimeAndDate(stopIds, 0, moment().add(1, 'd'), 'DEPARTURE_TIME', 'ASC', 0, 1000)
        .publicTransport.findStopsByIds(stopIds)
        .callback((data) => {
          var todayStopTimes =  _.flatten(data[0]);
          var tomorrowStopTimes =  _.flatten(data[1]);
          var stopMap = _.keyBy(data[2], 'id');
          
          for (let i = 0; i < todayStopTimes.length;i++) {
            todayStopTimes[i].stop = stopMap[todayStopTimes[i].stopTime.stopId];
          }
          todayStopTimes.sort((a, b) => {
            return a.stopTime.departureTime - b.stopTime.departureTime;
          });

          for (let i = 0; i < tomorrowStopTimes.length;i++) {
            tomorrowStopTimes[i].stop = stopMap[tomorrowStopTimes[i].stopTime.stopId];
            tomorrowStopTimes[i].stopTime.departureTime = tomorrowStopTimes[i].stopTime.departureTime + 24 * 60 * 60;
          }
          tomorrowStopTimes.sort((a, b) => {
            return a.stopTime.departureTime - b.stopTime.departureTime;
          });

          res.render('ajax/timetable.pug', {
            timetables: todayStopTimes.concat(tomorrowStopTimes)
          });
        });
    });
    
  };

}).call(this);