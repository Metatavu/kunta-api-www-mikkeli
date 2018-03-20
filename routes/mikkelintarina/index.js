/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  module.exports = (app, config, ModulesClass) => {
    
    app.get('/mikkelin-tarina', (req, res) => {
      const q = req.query.q;
      const buffer =  Buffer.from(q, 'base64');
      const formValues = JSON.parse(buffer.toString());
      
      res.render('pages/mikkelin-tarina-result.pug', {
        
      });
    });
  };
})();