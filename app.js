var fs = require('fs');
var express = require('express');
var https = require('https');
var key = fs.readFileSync('./app/assets/ssl/key.pem');
var cert = fs.readFileSync('./app/assets/ssl/cert.pem')

var https_options = {
    key: key,
    cert: cert,
    passphrase: '24436525'
};

var PORT = 3100;
var HOST = '192.168.1.53'; 
app = express();


server = https.createServer(https_options, app).listen(PORT, HOST);
console.log('HTTPS Server listening on %s:%s', HOST, PORT);

app.use(express.static('app'));

// routes
app.get('/', function(req, res) {
    res.sendFile('index.html');
});
app.post('/ho', function(req, res) {
    res.send('HO!');
});