/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  module.exports = (app, config, ModulesClass) => {
    
    app.post('/ajax/metaform', (req, res) => {
      const metaformId = req.body.id;
      const data = req.body.data;
      new ModulesClass(config)
        .metaform.createReply(metaformId, data)
        .callback((data) => {
          res.send(data);
        });
    });
  };
})();