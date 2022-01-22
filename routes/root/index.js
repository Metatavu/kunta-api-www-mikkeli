/*jshint esversion: 6 */
/*global __dirname*/
(function() {
  'use strict';

  const util = require("util");
  const moment = require("moment");
  const _ = require("lodash");
  const Common = require(__dirname + "/../common");
  const Autolinker = require("autolinker");

  /**
   * Provides time left before the event
   * 
   * @param {moment} date event date
   * @returns {number} time before the event
   */
  function hasTime(date) {
    const momentDate = moment(date);
    const midnight = momentDate.clone().startOf("day");

    return momentDate.diff(midnight) > 0;
  }

  /**
   * Does event start and end on the same day
   * 
   * @param {moment} start start date
   * @param {moment} end end date
   * @returns {boolean} 
   */
  function isSameDay(start, end) {
    const startMoment = moment(start);
    const endMoment = moment(end);

    return startMoment.isSame(endMoment, "day");
  }

  /**
   * Provides a date part format
   * 
   * @param {moment} date event date
   * @returns {moment} date formatted
   */
  function formatDatePart(date) {
    if (hasTime(date)) {
      return moment(date).format("D.M.YYYY HH:mm");
    }

    return moment(date).format("D.M.YYYY");
  }

  /**
   * Provides a format form date
   * 
   * @param {moment} start start date
   * @param {moment} end end date
   * @returns {moment} date formatted
   */
  function formatDate(start, end) {
    if (!end && !hasTime(start)) {
      return moment(start).format("D.M.YYYY");
    } else if (!end && hasTime(start)) {
      const startMoment = moment(start);
      return `${startMoment.format("D.M.YYYY")} klo ${startMoment.format("H:mm")} alkaen`;
    } else if (isSameDay(start, end) && !hasTime(start)) {
      return moment(start).format("D.M.YYYY");
    } else if (moment(start).isSame(moment(end))) {
      return formatDatePart(start);
    } else if (isSameDay(start, end)) {
      const startMoment = moment(start);
      const endMoment = moment(end);
      return `${startMoment.format("D.M.YYYY")} klo ${startMoment.format("H:mm")} - ${endMoment.format("H:mm")}`;
    } else {
      return `${formatDatePart(start)} - ${formatDatePart(end)}`;
    }
  }

  module.exports = (app, config, ModulesClass) => {

    /**
     * Lists events from LinkedEvents API
     *
     * @param {number} perPage events per page
     * @param {number} page page number (1 based)
     * @param {moment} start start date
     * @param {moment} end end date
     * @param {string} defaultImage default image
     * @returns {Promise} promise for events
     */
    async function listEvents(perPage, page, start, end, defaultImage) {
      const eventsApi = Common.getLinkedEventsEventsApi(config);

      const listOptions = {
        sort: "end_time",
        page: page,
        pageSize: perPage,
        include: ["location"]
      };

      if (start) {
        listOptions["start"] = start.toDate();
      }

      if (end) {
        listOptions["end"] = end.toDate();
      }

      const events = (await eventsApi.eventList(listOptions)).data;
      return events.map(event => translateEvent(event, defaultImage));
    }

    /**
     * Translates LinkedEvents event into format expected by the pug templates
     *
     * @param {any} event LinkedEvents event
     * @param {string} defaultImage default image
     * @returns {any} translated event
     */
    function translateEvent(event, defaultImage) {
      const shortDescription = (event.short_description ? event.short_description.fi : "") || "";
      const description = (event.description ? event.description.fi : "") || "";
      const originalUrl = (event.info_url ? event.info_url.fi : "") || "";
      const name = (event.name ? event.name.fi : "") || "";
      const imageUrl = event.images && event.images.length ? event.images[0].url : null;
      const place = event.location ? event.location.name.fi : "";
      const start = formatDate(event.start_time, event.end_time);

      return {
        id: event.id,
        name: name,
        place: place,
        originalUrl: originalUrl,
        start: start,
        shortDate: moment(event.start_time).format("D/M"),
        imageSrc: imageUrl || defaultImage,
        description: Common.plainTextParagraphs(Autolinker.link(description)),
        shortDescription: _.truncate(shortDescription, { length: 200 })
      };
    }
    
    app.get('/', async (req, res, next) => {
      const [ events, announcements ] = await Promise.all([
        listEvents(Common.EVENT_COUNT, 1, moment(), undefined, "/gfx/layout/tapahtuma_default_120_95.jpg"),
        Common.listAnnouncements(config, 5)
      ]);
      
      new ModulesClass(config)
        .news.latest(0, 9)
        .banners.list()
        .tiles.list()
        .socialMedia.latest(Common.SOCIAL_MEDIA_POSTS)
        .jobs.list(Common.JOB_COUNT, 'PUBLICATION_END', 'ASCENDING')
        .callback(function(data) {

          var news = _.clone(data[0]).map(newsArticle => {
            return Object.assign(newsArticle, {
              "shortDate": moment(newsArticle.published).format("D.M.YYYY"),
              "imageSrc": newsArticle.imageId ? util.format('/newsArticleImages/%s/%s', newsArticle.id, newsArticle.imageId) : null
            });
          });
          
          var banners = _.clone(data[1] || []).map(banner => {
            var styles = [];
            
            if (banner.textColor) {
              styles.push(util.format('color: %s', banner.textColor));
            }

            if (banner.backgroundColor) {
              styles.push(util.format('background-color: %s', banner.backgroundColor));
            }
            
            return Object.assign(banner, {
              imageSrc: banner.imageId ? util.format('/bannerImages/%s/%s', banner.id, banner.imageId) : '/gfx/layout/mikkeli-banner-default.jpg',
              style: styles.join(';')
            });
          });

          var tiles = _.clone(data[2] || []).map(tile => {
            return Object.assign(tile, {
              imageSrc: tile.imageId ? util.format('/tileImages/%s/%s', tile.id, tile.imageId) : '/gfx/layout/mikkeli-tile-default.jpg'
            });
          });

          var socialMediaItems = _.clone(data[3] || []).map(socialMediaItem => {
            return Object.assign(socialMediaItem, {
              "shortDate": moment(socialMediaItem.created).format("D.M.YYYY hh:mm")
            });
          });

          var jobs = _.clone(data[4] || []);
          
          res.render('pages/index.pug', Object.assign(req.kuntaApi.data, {
            events: events,
            banners: banners,
            tiles:  tiles,
            socialMediaItems: socialMediaItems,
            jobs: jobs,
            announcements: announcements,
            news: {
              thumbs: news.splice(0, 6),
              texts: news
            }
          }));

        }, (err) => {
          next({
            status: 500,
            error: err
          });
        });
    });
  };

}).call(this);