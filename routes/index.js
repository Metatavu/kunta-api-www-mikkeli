(function() {
  
  module.exports = function(app, modules) {
  
    app.get('/', function(req, res) {
      
      modules
        .events.latest(3)
        .callback(function (data) {
          console.log(data[0]);
          
          res.render('pages/index.pug', { 
            events: data[0]
          });
        }, function (err) {
          console.log(err);
          res.status(500).send(err);
        });
    });
    
  };
  
}).call(this);