/*jshint esversion: 6 */
/* global __dirname */

(() => {
  'use strict';

  const request = require("request");
  const vCard = require("vcf");
  const Common = require(__dirname + "/../common");

  function translateCardAddress(adr) {
    const values = adr.valueOf().split(";");

    const streetAddresses = values[2] || "";
    const localities = values[3] || "";
    const postalCodes = values[5] || "";

    const postOfficeText = [ postalCodes, localities ].join("\u00A0");
    
    return [streetAddresses, postOfficeText].filter(i => !!i).join(", ");
  }
  
  function translateCardToContact(card) {
    const titles = Array.isArray(card.get("title")) ? card.get("title") : [ card.get("title") ];
    const orgs = Array.isArray(card.get("org")) ? card.get("org") : [ card.get("org") ];
    const adrs = Array.isArray(card.get("adr")) ? card.get("adr") : [ card.get("adr") ];
    const emails = Array.isArray(card.get("email")) ? card.get("email") : [ card.get("email") ];
    const tels = Array.isArray(card.get("tel")) ? card.get("tel") : [ card.get("tel") ];
    const fn = card.get("fn");
    
    return {
      displayName: fn ? fn.valueOf() : "",
      title: titles.filter(i => !!i).map(title => title.valueOf()).join(", "),
      emails: emails.filter(i => !!i).map(email => email.valueOf()),
      phoneNumbers: tels.filter(i => !!i).map(tel => tel.valueOf()),
      contactAddresses: adrs.filter(i => !!i).map(adr => translateCardAddress(adr)),
      organizationUnits: orgs.filter(i => !!i && i.valueOf() !== "null").map(org => org.valueOf())
    };
  }
  
  module.exports = (app, config, ModulesClass) => {
    
    app.get('/ajax/contactSearch', (req, res) => {
      const search = req.query.search;      
      const page = parseInt(req.query.page)||0;
      const perPage = Common.SEARCH_CONTACT_PER_TYPE;

      request(config.get("contacts"), (error, response, body) => {
        const cards = vCard.parse(body);
        const allContacts = cards.map(card => translateCardToContact(card));
        const startIndex = page * perPage;        
        const filteredContacts = allContacts.filter((contact) => {
          if (!search) {
            return true;
          }

          const units = (contact.organizationUnits || []).join(" ");
          const haystack = `${contact.displayName || ""} ${contact.title || ""} ${units || ""}`.toLocaleLowerCase();
          return haystack.indexOf((search || "").toLocaleLowerCase()) > -1;
        });
        
        const lastPage = filteredContacts.length <= startIndex + perPage;
        const contacts = filteredContacts.splice(startIndex, perPage);    
        
        res.render("ajax/contacts-search.pug", {
          paged: page > 0 || !lastPage,
          page: page,
          lastPage: lastPage, 
          contacts: contacts
        });
      });
    });
    
  };

})();