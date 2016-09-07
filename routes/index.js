(function() {
  
  var moment = require('moment');
  
  module.exports = function(app, modules) {
  
    app.get('/', function(req, res) {
      
      modules
        .events.latest(3)
        .callback(function (data) {
          var events = (data[0]||[]).map(event => {
            return Object.assign(event, {
              "shortDate": moment(event.start).format("D/M")
            });
          });

          res.render('pages/index.pug', { 
            events: events
          });
         
        }, function (err) {
          console.log(err);
          res.status(500).send(err);
        });
    });
    
  };
  
}).call(this);