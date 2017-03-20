/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const Common = require(__dirname + '/../common');

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
        .publicTransport.listActiveStopTimesByStopIdsAndDepartureTimeAndDate(stopIds, departureTime, moment(), 'DEPARTURE_TIME', 'ASC', 0, Common.TIMETABLE_ROWS)
        .publicTransport.findStopsByIds(stopIds)
        .callback((data) => {
          var todayStopTimes =  _.flatten(data[0]);
          var stopMap = _.keyBy(data[1], 'id');
          
          for (let i = 0; i < todayStopTimes.length;i++) {
            todayStopTimes[i].stop = stopMap[todayStopTimes[i].stopTime.stopId];
          }
          todayStopTimes.sort((a, b) => {
            return a.stopTime.departureTime - b.stopTime.departureTime;
          });

          if (data[0].length < Common.TIMETABLE_ROWS) {
            new ModulesClass(config)
              .publicTransport.listActiveStopTimesByStopIdsAndDepartureTimeAndDate(stopIds, 0, moment().add(1, 'd'), 'DEPARTURE_TIME', 'ASC', 0, Common.TIMETABLE_ROWS)
              .callback((nextData) => {
                var tomorrowStopTimes = _.flatten(nextData[0]);
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
          } else {
            res.render('ajax/timetable.pug', {
              timetables: todayStopTimes
            }); 
          }
        });
    });
    
  };

}).call(this);