(function() {
  
  var moment = require('moment');
  
  var eventPages = 3;
  var eventsPerPage = 3;
  
  module.exports = function(app, modules) {
  
    app.get('/', function(req, res) {
      
      modules
        .events.latest(eventPages * eventsPerPage)
        .callback(function (data) {
          var events = (data[0]||[]).map(event => {
            return Object.assign(event, {
              "shortDate": moment(event.start).format("D/M")
            });
          });
          
          var eventPages = [];
          while (events.length) {
            eventPages.push(events.splice(0, eventsPerPage));
          }

          res.render('pages/index.pug', { 
            eventPages: eventPages
          });
         
        }, function (err) {
          console.log(err);
          res.status(500).send(err);
        });
    });
    
  };
  
}).call(this);