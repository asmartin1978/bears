// server.js

// BASE SETUP
// =============================================================================

var express    = require('express');        // Importacion del framework express
var app        = express();                 // Instanciacion de la API usando express
var bodyParser = require('body-parser');    // Instanciaion de bodyParser para procesar el request.


app.use(bodyParser.urlencoded({ extended: true })); //Configuro body parser para leer JSON en el body
app.use(bodyParser.json());

var passport = require("passport");
//Importamos la estrategia
var auth     = require('./auth');
//Le decimos a passport que la use
passport.use(auth.strategy);
app.use(passport.initialize());



var mongoose   = require('mongoose');   //Importacion de mongoose
var Bear     = require('./app/models/bear'); // Importacion de la clase BEAR

var dbURI = 'mongodb://user:user@ds149954.mlab.com:49954/bears';  //Cadena de conexion a la BD Mongo

mongoose.connect(dbURI); // Conexion a la BD

//Callback para procesar el evento connected
mongoose.connection.on('connected', function () {  
  console.log('Conectado a la Base de Datos');
}); 

//Callback para procesar el evento error
mongoose.connection.on('error',function (err) { 
   console.log('Error de conexion de Mongoose: ' + err);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('Desconectado de la Base de Datos'); 
});

//Seleccion del puerto
var port = process.env.PORT || 8080;        // set our port






// ENRUTAMIENTO
// =============================================================================
var router = express.Router();              // Instancio el router de express

// middleware
router.use(function(req, res, next) {
    // do logging
    console.log('Peticion recibida');
    next(); // Hay que llamar al siguiente middleware
});


// Ruta de test (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});



router.route('/login')

    .post(function(req, res) {
          //Pillamos parametros del request
          if(req.body.name && req.body.password){
            var name = req.body.name;
            var password = req.body.password;
          }

          return auth.autenticar(name, password, res);

    });




//Entutamiento de bears, para la colecion entera
router.route('/bears')

    // create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(passport.authenticate('jwt', { session: false }),function(req, res) {

        var bear = new Bear();      // create a new instance of the Bear model
        bear.name = req.body.name;  // set the bears name (comes from the request)

        // save the bear and check for errors
        bear.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Bear created!' });
        });

    })

     // get all the bears (accessed at GET http://localhost:8080/api/bears)
    .get(passport.authenticate('jwt', { session: false }), function(req, res) {
        Bear.find(function(err, bears) {
            if (err)
                res.send(err);

            res.json(bears);
        });
    });


//Acceso a un item de la coleccion
router.route('/bears/:bear_id')

    // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
    .get(passport.authenticate('jwt', { session: false }),function(req, res) {
        Bear.findById(req.params.bear_id, function(err, bear) {
            if (err)
                res.send(err);
            res.json(bear);
        });
    })

    // update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
    .put(passport.authenticate('jwt', { session: false }),function(req, res) {

        // use our bear model to find the bear we want
        Bear.findById(req.params.bear_id, function(err, bear) {

            if (err)
                res.send(err);

            bear.name = req.body.name;  // update the bears info

            // save the bear
            bear.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Bear updated!' });
            });

        });
    })

    // delete the bear with this id (accessed at DELETE http://localhost:8080/api/bears/:bear_id)
    .delete(passport.authenticate('jwt', { session: false }),function(req, res) {
        Bear.remove({
            _id: req.params.bear_id
        }, function(err, bear) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });




// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);



// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Servicio arrancado en el puerto ' + port);