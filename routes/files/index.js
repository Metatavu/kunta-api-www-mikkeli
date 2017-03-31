/*jshint esversion: 6 */
(function() {
  'use strict';

  const util = require('util');
  const Common = require(__dirname + '/../common');

  module.exports = (app, config, ModulesClass) => {

    app.get(util.format('%s/:id', Common.FILES_FOLDER), (req, res, next) => {
      var id = req.params.id;
      if (!id) {
        next({
          status: 404
        });
        
        return;
      }
      
      new ModulesClass(config)
        .files.findById(id)
        .files.streamData(id)
        .callback((result) => {
          var file = result[0];
          var stream = result[1];
          
          if (file && stream) {
            res
              .set('Content-Length', file.size)
              .set('Content-Type', file.contentType)
              .set("content-disposition", util.format("attachment; filename=%s", file.slug));
            stream.pipe(res);
          } else {
            next({
              status: 500,
              message: "Tiedoston lataus epäonnistui"
            });
          }
        });
    });
    
  };

}).call(this);