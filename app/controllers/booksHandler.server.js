'use strict';
if (process.env.LOCAL !== false) {
	require('dotenv').load();
}

const https = require('https');
const querystring = require('querystring');
var pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);

function BooksHandler() {

	/** */
	this.allBooks = function (req, res) {
		console.log('allBooks callback');
		var searchTerm = req.query.terms;
		//save to session...
		req.session.lastSearch = searchTerm;

		// console.log(req.session.lastSearch);
		const queryData = querystring.stringify({
			q: searchTerm.toString(),
			// orderBy: 'relevance',
			// printType: 'books',			
			// maxResults: 20,
			key: process.env.API_KEY
		});
		console.log(queryData);
		// console.log(querystring.escape(queryData));

		const options = {
			hostname: 'content.googleapis.com',
			port: 443,
			path: ('/books/v1/volumes?' + queryData),
			method: 'GET',
			headers: {
				'user-agent': 'clclarkFCC/1.0',
				'Accept-Language': 'en-US',
				'Connection': 'keep-alive'
			}
		};
		const sreq = https.request(options, (res2) => {
			var body1 = [];
			console.log(`STATUS: ${res2.statusCode}`);
			// console.log(`HEADERS: ${JSON.stringify(res2.headers)}`);

			res2.on('data', (d) => {
				body1.push(d);
				// console.log(d);
			});
			res2.on('end', () => {
				// console.log(body1);
				// console.log(JSON.parse(Buffer.concat(body1).toString()));
				try {
					var resJSON = JSON.parse(Buffer.concat(body1).toString());
					bookBuilder(resJSON.items, false)
						.then((result) => {
							res.json(result);
						})
						.catch();
					// console.log("all books");

					// bookBuilder(resJSON.items, false)
					/*	.then((middleware) => {
							return bookBuilder2(middleware, req.query.timeframe)//returns an array {yelpid: id, count: number}
								.then((bb2) => {
									let mapped = middleware.map((eachB) => {
										return new Promise((rezolve, rezect) => {
											var oldB = 0;
											if (bb2.length > 0) {
												bb2.forEach(apptCount => {
													oldB++;
													if (apptCount.yelpid == eachB.id) {
														eachB["count"] = apptCount.count;
														// console.log("---");
														rezolve(eachB);
													} else if (oldB == bb2.length) {
														// console.log(".");
														rezolve(eachB);
													} else {
														// console.log("\\");
														rezolve(eachB);
													}
												});
											} else {
												rezolve(eachB);
											}
										});
									});
									return (mapped);
								}).catch((e) => { });
							// return Promise.resolve(mapped);
						})
						.then(builtResults => {
							Promise.all(builtResults)
								.then((builtRez) => {
									res.json(builtRez);
									storeBusinesses(builtRez);
								})
								.catch((e) => { });
							// res.json(builtResults);
							// storeBusinesses(builtResults);
						})
						.catch(e => { console.log(e + " all books error"); });
						 */
				} catch (e) { console.error(e); }
			});
		});
		sreq.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		});
		sreq.end();
	}//allBooks function
	/**will not need - storeBusinesses
		function storeBusinesses(data) {
			//		var pool4 = new pg.Pool(config);
			//		var p = Promise.resolve();		
			//		for (let i = 0; i < data.length; i++) {
			//			p = p.then(() => {
			//				storeBusiness(data[i], pool4);				
			//			});			
			//		}//for loop

			var pool5 = new pg.Pool(config);
			let books = [];

			var multiBook = data.forEach(function (eachBook) {
				var promToP = storeBusiness(eachBook, pool5);
				books.push(promToP);
			});

			Promise.all(books)
				.then(doneInserting => (pool5.end()))
				.catch(e => { console.log(e + "store businesses error"); });

		}//store businesses		
		function storeBusiness(data, poolInst) {

			return new Promise((resolve, reject) => {

				var booksJSON = (data);

				var pool4 = poolInst;
				//			console.log("store business: ")
				// var i = 0;		
				const insertText = 'INSERT INTO books(\"busiName\", \"yelpID\") ' +
					'VALUES($1, $2) ' +
					'ON CONFLICT DO NOTHING RETURNING *';

				var busName = new String(booksJSON.title).substring(0, 140) || null; //arbitrary cut off
				var yelpId = new String(booksJSON.id).substring(0, 100) || null;

				var insertValues = [];
				insertValues.push(busName);
				insertValues.push(yelpId);
				// console.log(insertValues);

				//new postgresql connection
				pool4.connect()
					.then(client2 => {
						// console.log('pg-connected4');				
						client2.query(insertText, insertValues, function (err, result) {
							client2.release();
							if (err) {
								console.log(err);
								reject(err);
							} else {
								resolve(result);
								console.log("inserted books: " + result.rowCount);
							}
						});//client.query
					})
					.catch(err => console.error('error connecting2', err.stack));
				//			.then(() => {pool4.end()});
			}); //promise
		}//store businesses
	*/

	/*	appt object:
		timestamp	
		userid	
		yelpid	
		location	
		active
	*/
	//accepts JSON array of yelp businesses, then outputs JSON for client
	function bookBuilder(result, opts, single) {
		return new Promise((resolve, reject) => {
			console.log("bookBuilder callback");

			if (!Array.isArray(result) && single == false) {
				console.log(result);
				reject("input not an array");
			} else {
				//array not expected, insert single obj into array
				let tmpArray = []
				if (single == true) {
					//insert single object into array space
					tmpArray.push(result);
				} else {
					//use original array as tmpArray
					tmpArray = result;
				}
				var aggregator = [];
				var currentBook = ""; var currentPIndex = -1;
				var totalVotes = 0;
				var vRay = [];

				if (opts) { console.log(opts); }
				function findISBN(thisBook) {
					return new Promise((resolv, rejec) => {
						try {
							console.log(thisBook);
							let single = [];
							if (thisBook.hasOwnProperty("isbn13")) {
								resolv((thisBook.isbn13));
							} else
								if (thisBook.hasOwnProperty("volumeInfo")) {
									let idArr = thisBook["volumeInfo"];
									let indArr = Array.from(idArr["industryIdentifiers"]);
									single = indArr.filter((ident) =>
										ident.type == "ISBN_13"
									);
									resolv((single[0]["identifier"]));
								} else
									if (thisBook.hasOwnProperty("id")) {
										resolv((thisBook.id));
									} else {
										rejec(false);
									}
						} catch (e) { if (e instanceof TypeError) { resolv("N/A") } }
					});
				}
				let finalProm = tmpArray.map((value, index) => {
					return new Promise((resolve, reject) => {
						//return back to the mapping
						return findISBN(value)
						.then((isbnFound) => {
							console.log("inside return isbn");
							let book = value;
							// try {
								//dummy object "volumeInfo" if it is not included in Google API response
								let volDummy = book.volumeInfo || {
									title: "not found",
									authors: "not found",
									pageCount: "not found",
									imageLinks: "not found",
									language: "not found",
									infoLink: "not found"									
								};
								let bookTitle = book.title || volDummy.title;
								let bookAuthors = book.authors || volDummy.authors;
								let bookPublishedDate = book.publisheddate || volDummy["publishedDate"];
								let bookPages = book.pages || volDummy.pageCount;
								let imageLinks = volDummy.imageLinks || 
									{ thumbnail:	"no thumbnail" };
								let bookImageUrl = book["image_url"] || imageLinks.thumbnail;
								let bookLanguage = book.language || volDummy.language;
								let bookUrl = book.url || volDummy.infoLink;
								let bookJson = JSON.stringify(book) || "";
								let bookId = book.volume || book.id || null;
								resolve({
									id: bookId, //id as volume id
									title: bookTitle,
									authors: bookAuthors,
									publishedDate: bookPublishedDate,
									isbn13: isbnFound,
									pages: bookPages,
									image_url: bookImageUrl,
									language: bookLanguage,
									url: bookUrl,
									json_string: bookJson
								})
							/* } catch (error) {
								if (error instanceof TypeError) {
									//reject the object
									resolve(false);
								}
								else {
									reject(error);
								}
							}//caught error */

						}).catch((e) => { console.log(e) });
					});
				})
				Promise.all(finalProm)
					.then(wholeArray => {
						return Promise.resolve(
							wholeArray.filter((v) => v !== false)
						);
					})
					.then((filtered) => {
						resolve(filtered);
					})
					.catch((e) => {
						reject(e);
					});
				// resolve(aggregator);
			}//passes "array" test
		});
	}//bookBuilder

	//accepts JSON array of yelp businesses, then outputs JSON for client
	//accepts a "time" to refine db query to "relevant" dates
	function bookBuilder2(result, timeframe) {
		return new Promise((resolve, reject) => {
			console.log("bookBuilder2 callback");
			if (!Array.isArray(result)) {
				console.log(result);
				reject("input not an array");
			} else {
				promisifier(result, timeframe)
					.then((promBack) => {
						resolve(promBack);
					})
					.catch((e) => { console.log(e); })
			}
		});
		function promisifier(bookData, timeframe) {
			return new Promise((resolve, reject) => {
				//query pgsql with book data
				apptQMaker(bookData, timeframe)
					.then((queryArray) => {
						var poolAQ = new pg.Pool(config);
						let text = queryArray[0];
						let values = queryArray[1];
						//connect and query postgresql db
						poolAQ.connect()
							.then(client => {
								// console.log('pg-connected: promisifier')
								client.query(text, values, function (err, resultAQ) {
									if (err) {
										console.log("get appts error");
										console.log(resultAQ);
										reject(err);
									} else {
										let rc = resultAQ.rowCount;
										client.release();
										if (rc == 0) { //resolve an empty array
											resolve([]);
											console.log("empty results");
										} else {
											resolve(resultAQ.rows);
										}//else
									}//no error
								});//client.query
							})//pool
							.catch((e) => { console.error(e); });
					})//after query resolves
					.catch((e) => { console.error(e); })
			});//return statement
		}//promisifier

		//used on each book object
		//returns array in syntax to query PG database
		function apptQMaker(bookz, timeframe) {
			return new Promise((resolve, reject) => {
				//query for only active "true" appointments
				var text = "SELECT yelpid, count(*) FROM appts WHERE NOT active = false AND timestamp >= $1 ";
				//placeholder for values
				const values = [];
				//insantiate an estimated locale time (72 hours before now)
				console.log(timeframe);
				var time = new Date(timeframe);
				time.setDate(time.getDate() - 0);
				values.push(time.toISOString());	//$1
				console.log(time.toISOString());
				if (Array.isArray(bookz)) {
					//yes> add each bookid and text to the arrays
					console.log(Array.isArray(bookz) + " : is array check : apptQMAKER");
					let cap = bookz.length - 1;
					var combNots = bookz.reduce(function (acc, cVal, cInd, array) {
						//add the bookid
						values.push(cVal.id);
						if (cInd < cap) {
							return acc.concat(('$' + (2 + cInd) + ', '));
						}
						else {
							return acc.concat(('$' + (2 + cInd)));
						}
					}, (text.concat(' AND yelpid IN ('))
					);
					resolve([combNots.concat(') GROUP BY yelpid'), values]);
				}
				else {
					console.log(Array.isArray(bookz) + " : is array check : apptQMAKER");
					//no>return the text/values:
					resolve([text, values]);
				}//else
			});//return
		}//apptQMaker
	}//bookBuilder2
	/*********************** *****************************/
	this.ourBooks = function (req, res) {
		 //optional parameter "exclusion=user" to exclude "her own books" from results
		console.log('handler.server.js.ourBooks');
		var pool = new pg.Pool(config);

		function queryMaker(exclTest) {
			return new Promise((resolve, reject) => {
				const values = [];
				var terms = req.query.terms;
				var tsQuery;
				//check if query has specific ownership id...
				var ownershipOne = req.query.ownership;
				if(ownershipOne && ownershipOne.length == 36){
					console.log("finding single ownership volume..." + ownershipOne);
					//find one	
					let text = returnText(" ownership.id = $2 AND ");
					//exclude user check not needed
					resolve([text, ["dummy_id",ownershipOne]]);	
				}				
				//check if query has terms (or not = find all books)
				else if (terms.length > 0 && terms.length < 50) {
					console.log("terms found: " + req.query.terms);
					let tsSplit = terms.split(/[ ,]+/);
					tsQuery = tsSplit.join(" & ");
					let text = returnText("tsv @@ to_tsquery($2) AND ");
					
					let userId = req.user.id;
					//exclude user?
					if(exclTest == "user"){
						resolve([text, [userId, tsQuery]]);
					} else {
						resolve([text, ["", tsQuery]]);
					}					
				}//if, search terms present
				else {
				//find all	
					let text = returnText("");
					//exclude user?
					let userCheck = req.user || false; //user logged in?
					if(userCheck !== false){
						let userId = req.user.id || "";
						if(exclTest == "user"){
							//user id for value [0]
							resolve([text, [userId]]);						
						} else {
							//empty string for owner id (array[0])
							resolve([text, ["dummy_id"]]);						
						}//else, not excluding
					//user is not logged in, then we can't exclude userid
					}else {
						//empty string for owner id (array[0])
						resolve([text, ["dummy_id"]]);						
					}//else, not excluding					
				}//else, no search terms
				function returnText(optQuery) {
					//SELECT title, authors[1] FROM books WHERE tsv @@ to_tsquery($2);
					let tmpText = 'SELECT books.title, books.volume, books.authors, books.isbn13, books.publisheddate, books.image_url, books.language, books.url, books.active, books.pages' +
					', ownership.id, ownership.bookid, ownership.owner, ownership.active, ownership.date_added, ownership.date_removed ' +
					' FROM ownership INNER JOIN books ON ownership.bookid = books.volume WHERE '
						+ optQuery +
					' NOT ownership.active = false ';					
					return tmpText.concat(" AND NOT ownership.owner = $1 ");					
				}//returnText fn
			});
		}
		//does user want "her own books" exluded?
		var exclusion = req.query.exclude || false;

		queryMaker(exclusion).then((textArray) => {
			var text = textArray[0];
			// console.log(text);	
			var values = textArray[1];
			// console.log(values);
			pool.connect()
				.then(client => {
					// console.log('pg-connected: getBooks')
					client.query(text, values, function (err, result) {
						if (err) {
							res.status(403);
							console.log(err);
							console.log("get appts error");
							res.json({ booksFound: "none" });
						}
						let rc = result.rowCount;
						client.release();
						if (rc == 0) {
							res.status(200);
							res.json({ booksFound: "none" });
						} else {
							console.log(JSON.stringify(result));
							bookBuilder(result.rows, false)
								.then(builtBooks => {
									console.log("built books: " + builtBooks);
									res.json(builtBooks);
								})
								.catch(e => { console.log(e + "loopy Loop"); });
							/* const promiseSerial = funcs =>
									funcs.reduce((promise, func) =>
										promise.then(result => func().then(Array.prototype.concat.bind(result))),
										Promise.resolve([])
									);
								// convert each url to a function that returns a promise
								const funcs = result.rows.filter(rowCheck => rowCheck).map(
									pgResp => () => yelpSingle(pgResp, null)
								);
	
								promiseSerial(funcs)
									.then(promies => (bookBuilder(promies, true)))
									.then(builtBooks => {
										res.json(builtBooks);
										// console.log("builtBarsVVVV");							
									})
									.catch(e => { console.log(e + "loopy Loop"); });
							*/
						}
					});
				})
				.catch(err => console.error('error connecting', err.stack))
				.then(() => pool.end());
		})
			.catch(err => console.error('error getAppts', err.stack))

		//requests single business data from yelp api,
		//TODO qps on a timer
		function yelpSingle(appt, options) {
			/***	appt object:				
				timestamp	
				userid	
				yelpid	
				location	
				active
				_id			*/
			return new Promise((resolve, reject) => {

				var queryData = querystring.escape(appt.yelpid);

				console.log("query data is:   " + queryData);

				var bodyJSON;
				var options = {
					hostname: 'api.yelp.com',
					port: 443,
					path: ('/v3/businesses/' + queryData),
					method: 'GET',
					headers: {
						'Authorization': ('Bearer ' + process.env.API_KEY),
						'user-agent': 'clclarkFCC/1.0',
						'Accept-Language': 'en-US',
					},
					timeout: 4000
				};
				const yreq = https.request(options, (resf) => {
					var body1 = [];
					console.log(`STATUS: ${res.statusCode}` + "yelp Single");
					// console.log(`HEADERS: ${JSON.stringify(resf.headers)}`);					
					if (resf.headers["content-type"] == "application/json") {

						resf.on('data', (d) => {
							body1.push(d);
						});
						resf.on('end', () => {
							try {
								// console.log(body1);
								// console.log("pre-parse");
								let bodyJSON = JSON.parse(Buffer.concat(body1).toString());
								// console.log(">>>>post-parse");
								//add original appointment data
								bodyJSON["appt"] = appt;

								// console.log(JSON.stringify(bodyJSON).substring(0, 20));
								// console.log("json body rec'd ***************");

								resolve(bodyJSON);
							} catch (e) { console.error(e.message); reject(e); }
						});
					}//if content type
					else {
						resf.on('data', (d) => {
							process.stdout.write(d);
						});
						resf.on('end', () => {
							reject("not json");
						});
					}
				});
				yreq.on('timeout', (e) => {
					console.error(`request timeout: ${e.message}`);
					yreq.abort();
					//resolve empty object
					resolve({});
				});
				yreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); reject(e); });
				yreq.end();
			});//promise		
		}//yelpSingle		
	}//ourBooks

	/***************************************** */
	this.myBooks = function (req, res) {
		var pool = new pg.Pool(config);
		function queryMaker() {
			return new Promise((resolve, reject) => {
				//query for only active "true" appointments
				var text = 'SELECT books.title, books.volume, books.authors, books.isbn13, books.publisheddate, books.image_url, books.language, books.url, books.active, books.pages' +
					', ownership.id, ownership.bookid, ownership.owner, ownership.active, ownership.date_added, ownership.date_removed ' +
					' FROM ownership INNER JOIN books ON ownership.bookid = books.volume WHERE ownership.owner = $1 AND NOT ownership.active = false ' +
					'';
				const values = [];
				var uid = req.user.id;
				values.push(uid);

				//check if query has any appts
				/* 	if (req.query.hasOwnProperty('appts') && Array.isArray(req.query.appts)) {
						//yes> add each appt and text to the arrays
						console.log(Array.isArray(req.query.appts) + " : is array check");
						let cap = req.query.appts.length - 1;
						var combNots = req.query.appts.reduce(function (acc, cVal, cInd, array) {
							values.push(cVal);
							if (cInd < cap) {
								return acc.concat(('$' + (2 + cInd) + ', '));
							}
							else {
								return acc.concat(('$' + (2 + cInd)));
							}
						}, (text.concat(' AND _id NOT IN ('))
						);
						resolve([combNots.concat(')'), values]);
				} */
				// else {
				//console.log(Array.isArray(req.query.appts) + " : is array check");
				//no>return the text/values:
				resolve([text, values]);
				// }
			});
		}
		//more code here

		queryMaker().then((textArray) => {
			var text = textArray[0];
			// console.log(text);	
			var values = textArray[1];
			// console.log(values);
			pool.connect()
				.then(client => {
					// console.log('pg-connected: getBooks')
					client.query(text, values, function (err, result) {
						if (err) {
							res.status(403);
							console.log(err);
							console.log("get appts error");
							res.json({ booksFound: "none" });
						}
						else {
							let rc;
							if (Array.isArray(result.rows)) {
								rc = result.rowCount;
							}
							else {
								rc = 0;
							}
							client.release();
							if (rc == 0) {
								res.status(200);
								res.json({ booksFound: "none" });
							} else {
								console.log(JSON.stringify(result));
								bookBuilder(result.rows, false)
									.then(builtBooks => {
										console.log("built books: " + builtBooks);
										res.json(builtBooks);
									})
									.catch(e => { console.log(e + "loopy Loop"); });
							}
							/* const promiseSerial = funcs =>
									funcs.reduce((promise, func) =>
										promise.then(result => func().then(Array.prototype.concat.bind(result))),
										Promise.resolve([])
									);
								// convert each url to a function that returns a promise
								const funcs = result.rows.filter(rowCheck => rowCheck).map(
									pgResp => () => yelpSingle(pgResp, null)
								);
	
								promiseSerial(funcs)
									.then(promies => (bookBuilder(promies, true)))
									.then(builtBooks => {
										res.json(builtBooks);
										// console.log("builtBarsVVVV");							
									})
									.catch(e => { console.log(e + "loopy Loop"); });
							*/
						}//else no error
					});
				})
				.catch(err => console.error('error connecting', err.stack))
				.then(() => pool.end());
		});

	}//myBooks
	/***************************************** */
	this.addMyBook = function (req, res) {
		// https://www.googleapis.com/books/v1/volumes/volumeId

		/**CODE FOR FILTERING ISBN
		 * let info = JSON.parse(polljone["json_string"]);
						let single = [];
						if (info.hasOwnProperty("volumeInfo")) {
							let idArr = info["volumeInfo"];
							let indArr = Array.from(idArr["industryIdentifiers"]);
							single = indArr.filter((ident) =>
								ident.type == "ISBN_13"
							);
							// console.log(single); //testing
							//has volumeInfo
						} else if (info.hasOwnProperty("id")) {
							single.push(info.id);
						}
						let addLink;
						//using google volume id (not isbn) TODO: update query client/server
						if (single.length > 0) {
							// addLink = ('/my-books?isbn=' + single[0]["identifier"]);
							addLink = single[0];
						}//identifier true	
						else {
							addLink = ('/my-books?isbn=' + polljone.id);
						}
		  * 
		 */

		console.log('addMyBook callback');
		var userId = new String(req.user.id).substring(0, 140) || null; //arbitrary cut off

		var options;
		var queryData;
		
		if(req.query.volume !== null && req.query.volume !== "undefined"){
			//1 get the book Google ID,
			var volId = new String(req.query.volume).substring(0, 20) || null;
			//save to session...
			req.session.lastSearch = req.query.volume;

			//2 query Google with ID
			queryData = querystring.escape(volId);
			console.log(queryData);

			options = {
				hostname: 'content.googleapis.com',
				port: 443,
				path: ('/books/v1/volumes/' + queryData),
				method: 'GET',
				headers: {
					'user-agent': 'clclarkFCC/1.0',
					'Accept-Language': 'en-US',
					'Connection': 'keep-alive'
				}
			}; //options
		}// if : volume ID present
		else if (req.query.isbn !== null && req.query.isbn !== "undefined") {
			//1 get the book Google ID,
			var volId = new String(req.query.isbn).substring(0, 17) || null;
			//save to session...
			req.session.lastSearch = req.query.isbn;

			//2 query Google with ID
			queryData = querystring.stringify({
				q: ("isbn:" + volId), //q=isbn:1234123412341
				// orderBy: 'relevance',
				// printType: 'books',			
				// maxResults: 20,
				key: process.env.API_KEY
			});
			console.log(queryData);
			
			options = {
				hostname: 'content.googleapis.com',
				port: 443,
				path: ('/books/v1/volumes?' + queryData),
				method: 'GET',
				headers: {
					'user-agent': 'clclarkFCC/1.0',
					'Accept-Language': 'en-US',
					'Connection': 'keep-alive'
				}
			}; //options
		}//if

		processAPICallPlusDB();

		function processAPICallPlusDB(){
			const sreq = https.request(options, (res2) => {
				var body1 = [];
				console.log(`STATUS: ${res2.statusCode}`); // console.log(`HEADERS: ${JSON.stringify(res2.headers)}`);			
				res2.on('data', (d) => {
					body1.push(d);
					// console.log(d);
				});
				res2.on('end', () => { // console.log(body1); 
					console.log(JSON.parse(Buffer.concat(body1).toString()));
					try {
						var resJSON = JSON.parse(Buffer.concat(body1).toString());
						bookBuilder(resJSON, false, true) //single object returned from google api, set true
							.then((result) => {
								//3 add to database with Google Data: books and ownership tables
								// console.log("bookBuilder result: " + JSON.stringify(result));
								return insertMyBook(result[0])
									.then((insertResult) => {
										console.log("insert result: " + insertResult)
										return updateOwnership(req, result[0], true)
									})
									.then((updateRes) => {
										res.json(updateRes);
									}).catch((e) => { console.log(e); })
							})
							.catch((err) => { console.log(e); });
					} catch (e) { console.error(e); res.sendStatus(404); }
				});
			});
			sreq.on('error', (e) => {
				console.error(`problem with request: ${e.message}`);
				res.sendStatus(404); 
			});
			sreq.end();

			//access postgres db
			function insertMyBook(book) {
				// console.log(JSON.stringify(book));
				return new Promise((resolve, reject) => {
					const insertText =
						'INSERT INTO public.books ("title", "volume", "isbn13","authors","publisheddate","pages","image_url","language","url","active") ' +
						'VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ' +
						' ON CONFLICT ("volume")' +
						'DO NOTHING RETURNING (title, volume, isbn13,authors,publisheddate,pages,image_url,language,url,active)';// RETURNING (title,isbn13,"authors","publisheddate","pages","image_url","language","url","active")';
					const insertValues = [];
					try {
						let bt = book.title || "";
						let bid = book.id;
						let bisbn = book.isbn13 || "";
						let bauth = book.authors || "{None}";
						let bpd = book["publishedDate"] || "";
						let bpag = book.pages || "";
						let bimg = book["image_url"] || "";
						let blang = book.language || "";
						let burl = book.url || "";					

						insertValues.push(bt);						
						insertValues.push(bid);
						insertValues.push(bisbn);
						insertValues.push((bauth));
						insertValues.push((bpd));
						insertValues.push((bpag));
						insertValues.push((bimg));
						insertValues.push((blang));
						insertValues.push((burl));
						insertValues.push(true);
						/* do {
							insertValues.push('{null}'); //ensure length
						} while (insertValues.length 11 9); */
						function pushSafe(content) {
							if (content !== null) {
								return content;
							} else {
								return "null";
							}
						}//pushSafe
					} catch (error) { console.log(error); }

					//new postgresql connection
					var poolz3 = new pg.Pool(config);
					poolz3.connect()
						.then(client2 => {
							// console.log('pg-connected2');
							client2.query(insertText, insertValues, function (err, result) {
								client2.release();
								if (err) {
									console.log("REJECTED" + err); reject(err);
								} else {
									console.log("insertBook result: " + JSON.stringify(result));
									resolve(result.rows);
								}//else
							});//client.query
						})
						.catch(err => console.error('error connecting2', err.stack))
						.then(() => poolz3.end());
				});//insertPromise				
			}//insertMyBook fn
		}					
	}//this.addMyBook

	/**
	 * access postgres db, provide book data, pg pool, + "add or remove"
	 * @param {Object} bookData 
	 * @param {PG pool Object} exPool 
	 * @param {boolean} change 
	 */
	function updateOwnership(req, bookData, change) {
		return new Promise((resolve, reject) => {
			var insertText;
			const insertValues = [];
			let userid = req.user.id;
			let active;
			if (change == true) {
				//add operation
				active = change;
				insertText =
					//id is generated by postgres; "dateRemoved" not used
					'INSERT INTO public.ownership ("owner","bookid","date_added","active") ' +
					'VALUES($1, $2, $3, $4) ' +
					'RETURNING *';
				// 'ON CONFLICT (owner,bookisbn) DO NOTHING'
			} else if (change == false) {
				//remove operation
				active = change;
				insertText =
					//id is generated by postgres; "dateAdded" not used
					'INSERT INTO public.ownership ("owner","bookid","date_removed","active") ' +
					'VALUES($1, $2, $3, $4) ' +
					'RETURNING *';
				// 'ON CONFLICT (owner,bookisbn) DO NOTHING RETURNING (bookisbn)'; 
			}
			if (userid !== null && userid !== undefined) {
				try {
					let today = new Date(Date.now());
					insertValues.push(userid); //owner id
					insertValues.push(bookData.id); //book id
					insertValues.push(today.toISOString()); //dateAdded					
					insertValues.push(active);
					function pushSafe(content) {
						if (content !== null) { return content; } else { return "null"; }
					}//pushSafe
				} catch (error) { console.log("ownership try err: " + error); }
				//new postgresql connection
				var exPool = new pg.Pool(config);
				exPool.connect()
					.then(client2 => {
						// console.log('pg-connected2');
						client2.query(insertText, insertValues, function (err, result) {
							client2.release();
							if (err) {
								console.log("ownership query err: " + err); reject(err);
							} else {
								console.log("ownership result: " + JSON.stringify(result));
								resolve(result);
							}//else
						});//client.query
					})
					.then(() => { exPool.end(); })
					.catch(err => console.error('error connectingZ', err.stack))
				//end pool in parent function					
			}
		});//promise return
	}//updateOwnership
	/***************************************** */
	this.removeMyBook = function (req, res) {
		console.log('removeMyBook callback');
		var userId = new String(req.user.id).substring(0, 140) || null; //arbitrary cut off

		if (req.query.volume !== null && req.query.volume !== "undefined") {
			//1 get the book ID
			var volId = new String(req.query.volume).substring(0, 36) || null;
			removeFromDB(volId)
			.then(() => {
				res.json({status: "Successful remove"});
			}).catch((e) => {
				console.log(e);
				res.json({status: "Error in removal"});
			});
		}

		//TODO: update any trades... cancel them in postgres when book removed
		
		//access postgres db
		function removeFromDB(book) {
			return new Promise((resolve, reject) => {
				const insertText =
					// 'INSERT INTO public.ownership ("owner","bookid","date_added","date_removed","active") ' +
					// 'VALUES($1, $2, $3, $4, $5, $6) ' 
					'UPDATE public.ownership ' +
					' SET active = false, date_removed = $3 ' +					
					//  ' ON CONFLICT ("bookisbn")' +
					' WHERE ownership.owner = $1 AND ownership.id = $2 RETURNING *';
				const insertValues = [];
				try {															
					insertValues.push(userId); //owner/userid from authenticated user
					insertValues.push(book); //book ownership uuid... 
					let today = new Date(Date.now());			
					insertValues.push(today.toISOString()); //dateAdded	
				} catch (error) { console.log(error); }

					console.log(insertText)
					console.log(insertValues)
				//new postgresql connection
				var poolz3 = new pg.Pool(config);
				poolz3.connect()
					.then(client2 => {
						// console.log('pg-connected2');
						client2.query(insertText, insertValues, function (err, result) {
							client2.release();
							if (err) {
								console.log("REJECTED" + err); reject(err);
							} else {
								console.log("removeBook result: " + JSON.stringify(result));
								resolve(result.rows);
							}//else
						});//client.query
					})
					.catch(err => console.error('error connecting2', err.stack))
					.then(() => poolz3.end());
			});
		}//removeMyBook fn
	}//removeMyBook
	/***************************************** */

	//api call to "/my-trades"
	this.myTrades = function (req, res) {
		var pool = new pg.Pool(config);
		//adds the tradeId to the postgres query, to narrow the search.

		function preQueryFilter(){
			return new Promise((resolve, reject) => {
				if(req.query.hasOwnProperty('singleId')){
					//send the addendum text and the trade id String
					let tradeString = req.query.singleId;
					resolve([tradeString, ' AND ( trades.id = $2) ']); //reverse order to pop later
				}
				else{
					resolve(false);
				}
			});
		}
		function queryMaker(prequelArray) {
			return new Promise((resolve, reject) => {
				//trades db columns: "id","proposer","receiver","status","active","date_proposed","date_responded","paired_trade","pro_ownership","rec_ownership"
				/* var text = 'SELECT books.title, books.volume, books.authors, books.isbn13, books.publisheddate, books.image_url, books.language, books.url, books.active, books.pages' +
					', ownership.bookid, ownership.owner, ownership.active, ownership.date_added, ownership.date_removed ' +
					' FROM ownership INNER JOIN books ON ownership.bookid = books.volume WHERE ownership.owner = $1 AND NOT ownership.active = false ' +
					'';
				 */
				var text = 
				' SELECT trades.id,trades.proposer,trades.receiver,trades.status,trades.active,trades.date_proposed,trades.date_responded,trades.paired_trade,trades.pro_ownership,trades.rec_ownership ' +
				' FROM trades INNER JOIN ownership  proposer ON ( proposer.id = trades.pro_ownership ) INNER JOIN ownership receiver ON ( receiver.id = trades.rec_ownership ) ' +
				' WHERE (trades.proposer = $1 OR trades.receiver = $1) AND NOT (trades.active = false) ' +
				'';
				// ' RETURNING * ' ;

				const values = [];
				var uid = req.user.id;
				values.push(uid);

				//check if query has any appts
				/* 	if (req.query.hasOwnProperty('appts') && Array.isArray(req.query.appts)) {
						//yes> add each appt and text to the arrays
						console.log(Array.isArray(req.query.appts) + " : is array check");
						let cap = req.query.appts.length - 1;
						var combNots = req.query.appts.reduce(function (acc, cVal, cInd, array) {
							values.push(cVal);
							if (cInd < cap) {
								return acc.concat(('$' + (2 + cInd) + ', '));
							}
							else {
								return acc.concat(('$' + (2 + cInd)));
							}
						}, (text.concat(' AND _id NOT IN ('))
						);
						resolve([combNots.concat(')'), values]);
					} 
					// else {
					//console.log(Array.isArray(req.query.appts) + " : is array check");
					//no>return the text/values:
				*/
				if(prequelArray !== false){
					//trade id given
					resolve([(text.concat(prequelArray.pop())), values.concat(prequelArray)]);
				} else {
					//no trade id given
					resolve([text, values]);
				}
				// }
			});
		}
		//more code here

		preQueryFilter().then((prequelResult) => {
			//extract the single trade ID and supplement query text >
			queryMaker(prequelResult).then((textArray) => {
				var text = textArray[0];
				// console.log(text);	
				var values = textArray[1];
				// console.log(values);
				pool.connect()
					.then(client => {
						console.log('pg-connected: myTrades')
						client.query(text, values, function (err, result) {
							if (err) {
								res.status(403);
								console.log(err);
								console.log("get appts error");
								res.json({ tradesFound: "none" });
							}
							else {
								let rc;
								if (Array.isArray(result.rows)) {
									rc = result.rowCount;
								}
								else {
									rc = 0;
								}
								client.release();
								if (rc == 0) {
									res.status(200);
									res.json({ tradesFound: "none" });
								} else {
									console.log(JSON.stringify(result));
									res.json(result.rows);
									/* bookBuilder(result.rows, false)
										.then(builtBooks => {
											console.log("built books: " + builtBooks);
											res.json(builtBooks);
										})
										.catch(e => { console.log(e + "loopy Loop"); });
									 */
								}
								/* const promiseSerial = funcs =>
										funcs.reduce((promise, func) =>
											promise.then(result => func().then(Array.prototype.concat.bind(result))),
											Promise.resolve([])
										);
									// convert each url to a function that returns a promise
									const funcs = result.rows.filter(rowCheck => rowCheck).map(
										pgResp => () => yelpSingle(pgResp, null)
									);
		
									promiseSerial(funcs)
										.then(promies => (bookBuilder(promies, true)))
										.then(builtBooks => {
											res.json(builtBooks);
											// console.log("builtBarsVVVV");							
										})
										.catch(e => { console.log(e + "loopy Loop"); });
								*/
							}//else no error
						});
					})
					.catch(err => console.error('error connecting', err.stack))
					.then(() => pool.end());
			});//queryMaker
			
		}).catch((e) => {
			console.log(e);
		});
	}//myTrades
	/***************************************** */

	//for proposing a new trade
	this.newTrade = function (req, res) {
		let reqBook = req.body.requested.substring(0, 36);
		let offeredBook = req.body.proposed.substring(0, 36);
		console.log(reqBook + ":::" + offeredBook);
		res.sendStatus(200);

		/**
		 * 1. check if reqBook is not owned by "user"
		 * a. check if offeredBook is owned ...
		 * 2. 
		 * 3.
		 * 4.
		 * 5.
		 * 6.
		 * 7.
		 * 
		 */

	}//newTrade

	//for approving, rejecting, editing a trade
	this.tradeResponse = function (req, res) {

	}//tradeResponse

	/**myBooks equivalent */	//search DB for book data that user owns//'GET' to /books/db	
	this.getAppts = function (req, res) {
		// console.log('handler.server.js.getAppts');		
		var pool = new pg.Pool(config);
		function queryMaker() {
			return new Promise((resolve, reject) => {
				//query for only active "true" appointments
				var text = 'SELECT * FROM appts WHERE userid = $1 AND NOT active = false';

				const values = [];
				var uid = req.user.id;
				values.push(uid);

				//check if query has any appts
				if (req.query.hasOwnProperty('appts') && Array.isArray(req.query.appts)) {
					//yes> add each appt and text to the arrays
					console.log(Array.isArray(req.query.appts) + " : is array check");
					let cap = req.query.appts.length - 1;
					var combNots = req.query.appts.reduce(function (acc, cVal, cInd, array) {
						values.push(cVal);
						if (cInd < cap) {
							return acc.concat(('$' + (2 + cInd) + ', '));
						}
						else {
							return acc.concat(('$' + (2 + cInd)));
						}
					}, (text.concat(' AND _id NOT IN ('))
					);
					resolve([combNots.concat(')'), values]);
				}
				else {
					console.log(Array.isArray(req.query.appts) + " : is array check");
					//no>return the text/values:
					resolve([text, values]);
				}
			});
		}
		queryMaker().then((textArray) => {
			var text = textArray[0];
			// console.log(text);	
			var values = textArray[1];
			// console.log(values);
			pool.connect()
				.then(client => {
					// console.log('pg-connected: getAppts')
					client.query(text, values, function (err, result) {
						if (err) {
							res.status(403);
							console.log(err);
							console.log("get appts error");
							res.json({ barsFound: "none" });
						}
						let rc = result.rowCount;
						client.release();
						if (rc == 0) {
							res.status(200);
							res.json({ barsFound: "none" });
						} else {

							const promiseSerial = funcs =>
								funcs.reduce((promise, func) =>
									promise.then(result => func().then(Array.prototype.concat.bind(result))),
									Promise.resolve([])
								);
							// convert each url to a function that returns a promise
							const funcs = result.rows.filter(rowCheck => rowCheck).map(
								pgResp => () => yelpSingle(pgResp, null)
							);

							promiseSerial(funcs)
								.then(promies => (barBuilder(promies, true)))
								.then(builtBars => {
									res.json(builtBars);
									// console.log("builtBarsVVVV");							
								})
								.catch(e => { console.log(e + "loopy Loop"); });

						}
					});
				})
				.catch(err => console.error('error connecting', err.stack))
				.then(() => pool.end());
		})
			.catch(err => console.error('error getAppts', err.stack))
		//requests single business data from yelp api,
		//TODO qps on a timer
		function yelpSingle(appt, options) {
			/***	appt object:				
				timestamp	
				userid	
				yelpid	
				location	
				active
				_id			*/
			return new Promise((resolve, reject) => {

				var queryData = querystring.escape(appt.yelpid);

				console.log("query data is:   " + queryData);

				var bodyJSON;
				var options = {
					hostname: 'api.yelp.com',
					port: 443,
					path: ('/v3/businesses/' + queryData),
					method: 'GET',
					headers: {
						'Authorization': ('Bearer ' + process.env.API_KEY),
						'user-agent': 'clclarkFCC/1.0',
						'Accept-Language': 'en-US',
					},
					timeout: 4000
				};
				const yreq = https.request(options, (resf) => {
					var body1 = [];
					console.log(`STATUS: ${res.statusCode}` + "yelp Single");
					// console.log(`HEADERS: ${JSON.stringify(resf.headers)}`);					
					if (resf.headers["content-type"] == "application/json") {

						resf.on('data', (d) => {
							body1.push(d);
						});
						resf.on('end', () => {
							try {
								// console.log(body1);
								// console.log("pre-parse");
								let bodyJSON = JSON.parse(Buffer.concat(body1).toString());
								// console.log(">>>>post-parse");
								//add original appointment data
								bodyJSON["appt"] = appt;

								// console.log(JSON.stringify(bodyJSON).substring(0, 20));
								// console.log("json body rec'd ***************");

								resolve(bodyJSON);
							} catch (e) { console.error(e.message); reject(e); }
						});
					}//if content type
					else {
						resf.on('data', (d) => {
							process.stdout.write(d);
						});
						resf.on('end', () => {
							reject("not json");
						});
					}
				});
				yreq.on('timeout', (e) => {
					console.error(`request timeout: ${e.message}`);
					yreq.abort();
					//resolve empty object
					resolve({});
				});
				yreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); reject(e); });
				yreq.end();
			});//promise		
		}//yelpSingle		
	}//getAppts

	/**addMyBook equivalent */
	this.addAppt = function (req, res) {
		var timeStamp = new String(req.query.date).substring(0, 140) || null;
		var yelpId = new String(req.query.bid).substring(0, 100) || null;
		var userId = new String(req.user.id).substring(0, 140) || null; //arbitrary cut off		
		// create a new user
		const insertText = 'INSERT INTO appts(userid, yelpid, timestamp, location, active) ' +
			'VALUES($1, $2, $3, $4, $5) ' +
			'RETURNING *';
		const insertValues = [];
		insertValues.push(userId); //id
		insertValues.push(yelpId);
		insertValues.push(timeStamp);

		do {
			insertValues.push('{null}'); //ensure length
		} while (insertValues.length < 4);
		insertValues.push(true);

		//new postgresql connection
		var pool3 = new pg.Pool(config);
		pool3.connect()
			.then(client2 => {
				// console.log('pg-connected2');
				client2.query(insertText, insertValues, function (err, result) {
					client2.release();
					if (err) {
						console.log(err);
						res.sendStatus(404);
					} else {
						// console.log("inserted appt: ");
						// console.log(result.rows[0]);
						yelpSingle(result.rows[0], null)
							.then(promies => (barBuilder([promies], true)))
							.then(builtBars => {
								res.json(builtBars[0]);
								// console.log("builtAddAppt");
								// console.log(builtBars);
							})
							.catch(e => { console.log(e + "add appt yelpy"); });
					}
				});//client.query
			})
			.catch(err => console.error('error connecting2', err.stack))
			.then(() => pool3.end());
		// console.log('addAppt callback');
	}//addAppt

	/**request a single Google Book Api */
	function yelpSingle(appt, options) {
		/*
		appt object:				
			timestamp	
			userid	
			yelpid	
			location	
			active
			_id
		*/

		// console.log(appt);
		return new Promise((resolve, reject) => {

			var queryData = querystring.escape(appt.yelpid);

			console.log("query data is:   " + queryData);
			var bodyJSON;
			var options = {
				hostname: 'api.yelp.com',
				port: 443,
				path: ('/v3/businesses/' + queryData),
				method: 'GET',
				headers: {
					'Authorization': ('Bearer ' + process.env.API_KEY),
					'user-agent': 'clclarkFCC/1.0',
					'Accept-Language': 'en-US',
				}
			};

			const yreq = https.request(options, (resf) => {
				var body1 = [];
				console.log(`STATUS: ${resf.statusCode}` + "yelp Single");
				// console.log(`HEADERS: ${JSON.stringify(resf.headers)}`);
				if (resf.headers["content-type"] == "application/json") {
					resf.on('data', (d) => {
						body1.push(d);
					});
					resf.on('end', () => {
						try {
							let bodyJSON = JSON.parse(Buffer.concat(body1).toString());
							//add original appointment data
							bodyJSON["appt"] = appt;

							// console.log(JSON.stringify(bodyJSON).substring(0, 20));
							// console.log("json body rec'd ***************");
							resolve(bodyJSON);
						} catch (e) {
							console.log(bodyJSON);
							console.error(e.message);
							reject(e);
						}

					});
				}//if content type
				else {
					resf.on('data', (d) => {
						process.stdout.write(d);
					});
					resf.on('end', () => {
						reject("not json");
					});
				}
			});
			yreq.on('error', (e) => { console.error(`problem with request: ${e.message}`); reject(e); });
			yreq.end();
		});//promise		
	}//yelpSingle		

	/**remove my Book */
	this.deleteAppt = function (req, res) {

		var apptId = new String(req.query.appt).substring(0, 100) || null;
		var userId = new String(req.user.id).substring(0, 140) || null; //arbitrary cut off		
		// create a new user
		const insertText = 'UPDATE  appts SET active = false ' +
			"WHERE _id = \'" + apptId + "\' AND " +
			" userid = \'" + userId + "\'" +
			'RETURNING *';
		//new postgresql connection
		let pool3 = new pg.Pool(config);
		pool3.connect()
			.then(client2 => {
				// console.log('pg-connected5');
				client2.query(insertText, function (err, result) {
					client2.release();
					if (err) {
						console.log(err);
						res.status(403);
						res.json({ undefined: null });
					} else {
						console.log("expired appt: "); console.log(result.rows[0]["_id"]);
						res.status(200);
						res.json({ appt: "expired" });
					}
				});//client.query
			})
			.catch(err => console.error('error connecting2', err.stack))
			.then(() => pool3.end());
		console.log('deleteAppt callback');

	}//this.deleteBar




	/***search data for user profile + bars	
		this.myBars = function (req, res) {
			console.log('myBars callback');
		};
	 */

	/***find a single bar in the db
		this.singleBar = function (req, res, next) {
			console.log('handler.server.js.singleBar');
		}
	 */

	/***add singlebar
		this.addBar = function (req, res) { 
			console.log('handler.server.js.addBar');		
		}
	 */

	/***poll remnant
		this.removeChoice = function (req, res) {
			console.log('removeChoice callback');
		}
	 */

	/****poll remnant
		this.addVote = function (req, res) {
			console.log('addVote callback' + req.ip.substring(0,100));
		}
	 */

}//BooksHandler

module.exports = BooksHandler;
