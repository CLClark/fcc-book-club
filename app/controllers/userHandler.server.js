'use strict';
if (process.env.LOCAL !== false) {
	require('dotenv').load();
}

const https = require('https');
const querystring = require('querystring');
var pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);

function UserHandler() {
	
	this.updateProfile = function (req, res) {
		console.log('updateProfile callback');

		
	} //updateProfile	

}//UserHandler

module.exports = UserHandler;