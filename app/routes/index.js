'use strict';

var path = process.cwd();
var queue = require('queue')
var BooksHandler = require(path + '/app/controllers/booksHandler.server.js');

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
 
	/*app.route('/profile')
		.get(isLoggedIn, function (req, res) {
			res.sendFile(path + '/public/profile.html');
		});
 */
 
	/*app.route('/api/:id')
		.get(isLoggedIn, function (req, res) {
			pollsHandler.myPolls(req, res);
		});
*/
	/*********************************************/
	app.route('/auth/facebook')
		.get(passport.authenticate('facebook'));
	//	{ scope: [ 'public_profile' ]}

	app.route('/auth/facebook/callback')
		.get(passport.authenticate('facebook', {
			successRedirect: '/',
			failureRedirect: '/login'
			// ,failureFlash: true
		}));

	app.route('/auth/check')
		.get(isAuthed, function (req, res) {
			// res.json({ authStatus: 1, zipStore: req.session.lastZip });
			res.json({ authStatus: 1});
		});
	/*********************************************/
	var booksHandler = new BooksHandler();
	app.route('/books')
		.get(isLoggedIn, booksHandler.allBooks);		

	app.route('/club')
		.get(isLoggedIn, booksHandler.ourBooks);		
		
	app.route('/my-books')
		.get(isLoggedIn, booksHandler.myBooks);

	// app.route('/my-trades')
		// .get(isLoggedIn, booksHandler.myTrades);

	app.route('/books/db')
		.get(isLoggedIn, booksHandler.getAppts)
		.post(isLoggedIn, booksHandler.addAppt)
		.delete(isLoggedIn, booksHandler.deleteAppt);

};
