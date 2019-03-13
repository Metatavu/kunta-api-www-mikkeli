/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const moment = require('moment');
  const _ = require('lodash');
  const Common = require(__dirname + '/../common');

  module.exports = (app, config, ModulesClass) => {
    
    app.get(util.format('%s/:id', Common.JOBS_FOLDER), (req, res) => {
      var id = req.params.id;
      if (!id) {
        res.status(404).send('Not found');
        return;
      }
      
      new ModulesClass(config)
        .jobs.findById(id)
        .jobs.list(100, 'PUBLICATION_END', 'ASCENDING')
        .callback((data) => {
          var activeJob = Object.assign(data[0], {
            "endTime": moment(data[0].publicationEnd).format('DD.MM.YYYY HH:mm'),
            "description": Common.plainTextParagraphs(data[0].description)
          });
          
          var jobs = _.clone(data[1] || []);
          var bannerSrc = '/gfx/layout/mikkeli-page-banner-default.jpg';
          
          res.render('pages/jobs.pug', Object.assign(req.kuntaApi.data, {
            activeJob: activeJob,
            jobs: jobs,
            bannerSrc: bannerSrc,
            breadcrumbs : [{path: util.format('%s/%s', Common.JOBS_FOLDER, activeJob.id), title: activeJob.title }]
          }));
  
        }, (err) => {
          console.error(err);
          res.status(500).send(err);
        });
    });

    app.get('/jobs', (req, res) => {
      const limit = parseInt(req.query.limit) || 5;
      const sortby = req.query.sortBy || 'PUBLICATION_END';
      const sortDir = req.query.sortDir || 'DESCENDING';
      
      new ModulesClass(config)
        .jobs.list(limit, sortby, sortDir)
        .callback((data) => {
          res.json(data);
        }, (err) => {
          console.error(err);
          res.status(500).send(err);
        });
    });
  };

}).call(this);