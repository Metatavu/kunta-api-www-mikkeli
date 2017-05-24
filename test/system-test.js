/* jshint esversion:6 */
/* global __dirname */

(function() {
  'use strict';
  
  const chai = require('chai');
  const expect = chai.expect;
  const NockController = require(__dirname + '/mock/nock.js');
  
  describe('System test', () => {
    it('Sanity test, should indicate that testing environment is working properly', () => {
      expect(true).to.equal(true);
    });
  });
  
})();