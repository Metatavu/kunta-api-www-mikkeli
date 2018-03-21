/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  const storyValuesLookUp = require('./story-values.json');

  module.exports = (app, config, ModulesClass) => {
    
    function normalizeQuestionValue(questionValue) {
      return questionValue.indexOf('$') > -1 ? questionValue.split('$')[0] : questionValue;
    }

    app.get('/mikkelin-tarina', (req, res) => {
      const q = req.query.q;
      const buffer =  Buffer.from(q, 'base64');
      const formValues = JSON.parse(buffer.toString());
      const storyValuesOrder = ['ingres', 'question-2', 'question-4', 'question-6', 'question-3', 'question-5', 'question-8'];
      const story = [];

      storyValuesOrder.forEach((storyValue) => {
        const question = storyValuesLookUp[storyValue].question;
        let questionValue = formValues[question];
        if (questionValue) {
          story.push(storyValuesLookUp[storyValue].values[normalizeQuestionValue(questionValue)]);
        }
      });

      const imageLookup = storyValuesLookUp.images;
      const imageValue = normalizeQuestionValue(formValues[imageLookup.question]);
      const image = imageLookup.values[imageValue] || 'alamakihiihtaja1.jpg';

      res.render('pages/mikkelin-tarina-result.pug', {
        story: story.join(''),
        image: image
      });
    });
  };
})();