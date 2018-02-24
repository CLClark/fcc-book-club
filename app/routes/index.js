'use strict';

var path = process.cwd();
var queue = require('queue')
var BooksHandler = require(path + '/app/controllers/booksHandler.server.js');
var UserHandler = require(path + '/app/controllers/userHandler.server.js');

module.exports = function (app, passport) {

	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			console.log("is authenticated pass");
			return next();
		} else {
			console.log('is auth failed');
			res.status(403);
			res.json({ note: "Must Log In" });
		}
	}
	function isAuthed(req, res, next) {
		if (req.isAuthenticated()) {
			console.log('auth pass');
			return next();
		} else {
			console.log('auth fail');
			//			return next();
			res.json({ authStatus: 0, zipStore: req.session.lastZip });
		}
	}

	app.route('/main.html')
		.get(function (req, res) {
			res.sendFile(path + '/public/main.html');
		});

	app.route('/')
		.get(function (req, res) {			
			res.sendFile(path + '/public/index.html');
		});

	app.route('/index')
		.get(function (req, res) {
			res.sendFile(path + '/public/index.html');
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
		});
 
	app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});
 
 
	/*app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			pollsHandler.myPolls(req, res);
		});
*/
	/*********************************************/
	app.route('/auth/facebook')
		.get(passport.authenticate('facebook'));//, {
			// scope: [ 'public_profile' ] //, 'user_location' ]
		// }));

	app.route('/auth/facebook/callback')
		.get(passport.authenticate('facebook', {
			successRedirect: '/',
			failureRedirect: '/login'			
		}));

	app.route('/auth/check')
		.get(isAuthed, function (req, res) {
			// res.json({ authStatus: 1, zipStore: req.session.lastZip });			
			res.json({
				authStatus: 1,
				userId: req.user.id,
				displayName: req.user.displayName,
				city: req.user.city,
				state:  req.user.state
			});
		});
	/*********************************************/
	//form module
	var bodyParser = require('body-parser');
	// create application/x-www-form-urlencoded parser
	var urlencodedParser = bodyParser.urlencoded({ extended: false })	
	
	/******************************************* */
	var booksHandler = new BooksHandler();
	var userHandler = new UserHandler();

	app.route('/books')
		.get(isLoggedIn, booksHandler.allBooks);		

	app.route('/club')
		//no login required
		// .get(isLoggedIn, booksHandler.ourBooks);		
		.get(booksHandler.ourBooks)
		//handle profile updates		
		.post(isLoggedIn, urlencodedParser, function (req, res, next) {
			if (!req.body) return res.sendStatus(400);
			return next();
		      }, userHandler.updateProfile)
		
	app.route('/my-books')
		.get(isLoggedIn, booksHandler.myBooks)
		.post(isLoggedIn, booksHandler.addMyBook)
		.delete(isLoggedIn, booksHandler.removeMyBook);

	// app.route('/my-trades')
		// .get(isLoggedIn, booksHandler.myTrades);

	// app.route('/books/db')
	// 	.get(isLoggedIn, booksHandler.getAppts)
	// 	.post(isLoggedIn, booksHandler.addMyBook)
	// 	.delete(isLoggedIn, booksHandler.deleteAppt);

};
