const express = require('express');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


const fileupload = require('express-fileupload');
var short = require('short-uuid');

app.use(fileupload());
app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/js'))
app.use(express.static(__dirname + '/views'))
app.use(express.static(__dirname + '/node_modules/socket.io'))

app.get("/medium", (request, response) => {
  response.sendFile(__dirname + "/views/medium.html");
});

app.get("/rtp", (request, response) => {
  response.sendFile(__dirname + "/views/rtp.html");
});


const listener = server.listen(process.env.PORT, () => {
  console.log("Your app is listening at port : " + server.address().port);
});

io.sockets.on('connection',
              function (socket) {
                  console.log("New client: " + socket.id);

                  socket.on('hello',
                            function(data) {
	                            console.log("got hello", data)
                                socket.broadcast.emit('hello', data);
                            }
                           );

                  socket.on('offer',
                            function(data) {
		                        console.log("got offer")
                                socket.broadcast.emit('offer', data);
                            }
                           );
                  socket.on('answer',
                            function(data) {
		                        console.log("got answer")
                                socket.broadcast.emit('answer', data);
                            }
                           );

                  socket.on('candidate',
                            function(data) {
		                        console.log("got candidate")
                                socket.broadcast.emit('candidate', data);
                            }
                           );

                  socket.on('step',
                            function(data) {
                                socket.broadcast.emit('step', data);
                            }
                           );

                  socket.on('iterations',
                            function(data) {
                                socket.broadcast.emit('iterations', data);
                            }
                           );
                  socket.on('invert',
                            function(data) {
                                socket.broadcast.emit('invert', data);
                            }
                           );

                  socket.on('saturate',
                            function(data) {
                                socket.broadcast.emit('saturate', data);
                            });

                  socket.on('hue',
                            function(data) {
                                socket.broadcast.emit('hue', data);
                            });
                  socket.on('interpolate',
                            function(data) {
                                socket.broadcast.emit('interpolate', data);
                            }
                           );
                  socket.on('sharp',
                            function(data) {
                                socket.broadcast.emit('sharp', data);
                            }
                           );
                  socket.on('weight',
                            function(data) {
                                socket.broadcast.emit('weight', data);
                            });

                  socket.on('diffusionRate1',
                            function(data) {
                                socket.broadcast.emit('diffusionRate1', data);
                            }
                           );
                  socket.on('diffusionRate2',
                            function(data) {
                                socket.broadcast.emit('diffusionRate2', data);
                            }
                           );

                  socket.on('disconnect', function() {
                      console.log("Client has disconnected");
                  });
              });

app.post('/saveImage', (req, res) => {
    const image = req.files.image;
    const fileName = short.generate();
    const path = __dirname + '/public/' + fileName


    image.mv(path, (error) => {
        if (error) {
            console.error(error)
            res.writeHead(500, {
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({ status: 'error', message: error }))
            return
        }

        res.writeHead(200, {
            'Content-Type': 'application/json'
    })

    res.end(JSON.stringify({ status: 'success', path: fileName }))
  })
})

app.get('/loadImage/:fileName',(req,res)=>{
  var fileName = req.params.fileName;
  console.log("filename", fileName)
  io.sockets.emit('image',fileName)
 })
