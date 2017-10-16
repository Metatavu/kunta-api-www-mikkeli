/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const moment = require('moment');
  const cheerio = require('cheerio');
  const Promise = require('bluebird');
  const Common = require(__dirname + '/../common');
  
  module.exports = (app, config, ModulesClass) => {
    
    app.get('/ajax/contactSearch', (req, res) => {
      const search = req.query.search;
      const page = parseInt(req.query.page)||0;
      const perPage = Common.SEARCH_CONTACT_PER_TYPE;
      
      const searchTerms = _.map(search.replace(/\ {1,}/g, ' ').split(' '), (term) => {
        return `+(${term}*)`;
      });
      
      const searchString = searchTerms.join(' ');
      
      new ModulesClass(config)
        .contacts.search(searchString, page * perPage, perPage + 1, 'DISPLAY_NAME')
        .callback((data) => {
          const contacts = data[0];
          const lastPage = contacts.length < perPage + 1;
      
          res.render('ajax/contacts-search.pug', {
            paged: page > 0 || !lastPage,
            page: page,
            lastPage: lastPage, 
            contacts: _.map(contacts, (contact) => {
              return Object.assign({
                phoneNumbers: _.map(contact.phones||[], (phone) => {
                  const type = phone.type === 'fax' ? ' (Fax)' : '';
                  return `${phone.number}${type}`;
                }),
                contactAddresses: _.map(contact.addresses, (address) => {
                  const streetAddress = _.first(_.filter(address.streetAddress, (streetAddress) => {
                    return streetAddress.language === 'fi';
                  }));
                  
                  const postOffice = _.first(_.filter(address.postOffice, (postOffice) => {
                    return postOffice.language === 'fi';
                  }));
                  
                  const postalCode = address.postalCode;
                  const postOfficeText = [postalCode||'', postOffice ? postOffice.value : ''].join('\u00A0');
                  return [streetAddress ? streetAddress.value : '', postOfficeText ? postOfficeText : ''].join(', ');
                })
              }, contact);
            })
          });
        });
    });
    
  };

})();