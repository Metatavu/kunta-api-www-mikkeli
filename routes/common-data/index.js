/*jshint esversion: 6 */
(function() {
  'use strict';

  const _ = require('lodash');
  const Common = require(__dirname + '/../common');
  const util = require('util');

  module.exports = (app, config, ModulesClass) => {

    /**
     * Maps appropriate menus for given locale
     * 
     * @param {String} locale locale
     * @param {Object} menus available menus 
     */
    const getMenus = (locale, menus) => {
      const result = {};
      const localeRegex = /^([a-z]{2})_/;

      Object.keys(menus)
        .filter((menuSlug) => {
          const match = localeRegex.exec(menuSlug);
          const menuLocale = match && match.length > 0 ? match[1] : "fi";
          return menuLocale === locale;
        })
        .forEach((menuSlug) => {
          const bareSlug = menuSlug.replace(localeRegex, "");
          result[bareSlug] = menus[menuSlug];
        });

      return result;
    };

    app.use(function(req, res, next) {
      var modules = new ModulesClass(config);

      modules
        .menus.list()
        .fragments.list()
        .callback(function(data) {
          let localeCode = "fi";

          if (req.query.locale) {
            localeCode = req.query.locale;
            res.cookie("kawwwlocale", req.query.locale);
          } else if (req.cookies.kawwwlocale) {
            localeCode = req.cookies.kawwwlocale;
          }

          const locales = config.get("locales");

          var menus = getMenus(localeCode, data[0]);
          var fragments = data[1];

          _.keys(menus).forEach(menuKey => {
            var menu = menus[menuKey];

            menu.items = menu.items.map(item => {
              if (item.url) {
                item.url = Common.processLink(null, item.url);
              }

              return item;
            });
          });
          
          var fragmentMap = {};
          fragments.forEach((fragment) => {
            fragmentMap[fragment.slug] = fragment.contents;
          });

          const googleAnalytics = config.get('googleAnalytics:code');
          const liveChat = config.get('liveChat:license');

          const incidentUrls = [];
          const incidentsConfig = config.get('incidents:urls');
          const incidentsPollInterval = config.get('incidents:pollInterval') || 30000;
          const incidentScriptVersion = config.get('incidents:scriptVersion');
          const readSpeakerCustomerId = config.get('readSpeaker:customerId');
          const solidnetPopup = config.get('solidnetPopup:enabled');
          const readSpeakerUrl = encodeURIComponent(req.protocol + '://' + req.get('host') + req.originalUrl);
          
          if (Array.isArray(incidentsConfig)) {
            for (let i = 0; i < incidentsConfig.length; i++) {
              var incidentUrl = incidentsConfig[i].url;
              if (incidentsConfig[i].area) {
                incidentUrl += util.format('?area=%s', encodeURIComponent(incidentsConfig[i].area));
              }
              incidentUrls.push(incidentUrl);
            }
          }

          const locale = locales.find((locale) => {
            return locale.code == localeCode;
          });

          req.kuntaApi = {
            data: {
              locale: locale,
              locales: locales,
              menus: menus,
              fragmentMap: fragmentMap,
              googleAnalytics: googleAnalytics,
              liveChat: liveChat,
              readSpeakerCustomerId: readSpeakerCustomerId,
              readSpeakerUrl: readSpeakerUrl,
              solidnetPopup: solidnetPopup,
              incidentUrls: incidentUrls.join(','),
              incidentsPollInterval: incidentsPollInterval,
              incidentScriptVersion: incidentScriptVersion
            }
          };

          next();
        }, (err) => {
          next({
            status: 500,
            error: err
          });
        });
    });
    
  };

}).call(this);