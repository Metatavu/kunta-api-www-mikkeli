/*jshint esversion: 6 */
/* global __dirname */

(function() {
  "use strict";

  const util = require("util");
  const Common = require(__dirname + "/../common");
  const moment = require("moment");
  const _ = require("lodash");
  const $ = require("cheerio");

  module.exports = (app, config, ModulesClass) => {

    app.get(Common.ANNOUNCEMENTS_FOLDER + "/", async (req, res, next) => {
      try {
        const announcements = await Common.listAnnouncements(config, 100);
        const bannerSrc = "/gfx/layout/mikkeli-page-banner-default.jpg";
  
        res.render("pages/announcements-list.pug", Object.assign(req.kuntaApi.data, {
          bannerSrc: bannerSrc,
          announcements: announcements,
          breadcrumbs : [{path: util.format("%s/", Common.ANNOUNCEMENTS_FOLDER), title: "Kuulutukset"}]
        }));
      } catch (e) {
        next({
          status: 500,
          error: e
        });
      }
    });
  };

}).call(this);