'use strict';

if(process.env.LOCAL !== true){
	require('dotenv').load();
}
var express = require('express');
var routes = require('./app/routes/index.js');
var session = require('express-session');
var pg = require('pg');
var pgSession = require('connect-pg-simple')(session);
var parse = require('pg-connection-string').parse;
const fs = require('fs');
var http = require('http');

var passport = require('passport');

//postgresql config
var config = parse(process.env.DATABASE_URL);
config.ssl = true;

var app = express();
require('./app/config/passport')(passport);

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

var pgPool = new pg.Pool(config);
app.use(session({
	store: new pgSession({
		pool: pgPool,                // Connection pool 
		tableName: 'session'   // Use another table-name than the default "session" one 
	}),
	secret: process.env.ZOO_COOKIE_SECRET,
	resave: false,
	cookie: { maxAge: 1* 24 * 60 * 60 * 1000 }, // 2 days
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// routes(app);
routes(app, passport);

const server = http.createServer(app);

// var dsConfig = "./app/config/config.yml";
// const Deepstream = require('deepstream.io')
// const ds = new Deepstream(dsConfig);
// // var deepstreamC = require('deepstream.io-client-js');
// // const client = deepstreamC('ws://localhost:6020').login({username: "server"});
// ds.start();

var port;
if(process.env.LOCAL == false){
	port = '/tmp/nginx.socket';
}else{
	port = 8080;}

server.listen(port, function () {
	console.log('Node.js listening on port ' + port + '...');
	fs.closeSync(fs.openSync('/tmp/app-initialized', 'w'));	
});



