'use strict';
if(process.env.LOCAL !== true){
	require('dotenv').load();
}

const https = require('https');
const querystring = require('querystring');
var pg = require('pg');
var parse = require('pg-connection-string').parse;
var config = parse(process.env.DATABASE_URL);

function BarsHandler () {
	
	//find all active bars (for app home page)
	this.allBars = function (req, res) {
// console.log('allBars callback');
		//yelp api query
		//save to session
		var zipLocation = req.query.zip;
		req.session.lastZip = zipLocation;
// console.log(req.session.lastZip);
		const queryData = querystring.stringify({			
			term: 'bars',
			'location': zipLocation.toString(),
			categories: 'bars',
			limit: 10
		});
// console.log(queryData);
		
		const options = {
			hostname: 'api.yelp.com',
			port: 443,
			path: '/v3/businesses/search?' + queryData,
			method: 'GET',
			headers: {
				'Authorization': ('Bearer ' + process.env.API_KEY),
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
// console.log("all bars");
					barBuilder(resJSON.businesses, false)
					.then((middleware) => {
						return barBuilder2(middleware, req.query.timeframe)//returns an array {yelpid: id, count: number}
						.then((bb2) => {
							let mapped = middleware.map((eachB) => {
								return new Promise((rezolve, rezect) => {
									var oldB = 0;
									if(bb2.length > 0){
										bb2.forEach( apptCount => {
											oldB++;
											if(apptCount.yelpid == eachB.id){
												eachB["count"] = apptCount.count;
// console.log("---");
												rezolve(eachB);
											}else if(oldB == bb2.length){
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
						}).catch((e) => {	});						
						// return Promise.resolve(mapped);
					})
					.then( builtResults => {
						Promise.all(builtResults)
						.then((builtRez) => {
							res.json(builtRez);	
							storeBusinesses(builtRez);
						})
						.catch((e) => {	});	
						// res.json(builtResults);
						// storeBusinesses(builtResults);
					})
					.catch(e=>{ console.log(e + " all bars error");});					
				} catch (e) { console.error(e); }
			});
		});		
		sreq.on('error', (e) => {			
			console.error(`problem with request: ${e.message}`);
		});
		sreq.end();
	}//allBars function
	
	function storeBusinesses(data){
//		var pool4 = new pg.Pool(config);
//		var p = Promise.resolve();		
//		for (let i = 0; i < data.length; i++) {
//			p = p.then(() => {
//				storeBusiness(data[i], pool4);				
//			});			
//		}//for loop
		
		var pool5 = new pg.Pool(config);
		let bars = [];
		
		var multiBar = data.forEach( function (eachBar) {
			var promToP = storeBusiness(eachBar, pool5);
			bars.push(promToP);						
		});			
		
		Promise.all(bars)		
		.then(doneInserting => (pool5.end()))
		.catch(e=>{console.log(e + "store businesses error");});	
		
	}//store businesses		
	
	function storeBusiness(data, poolInst){		
		
		return new Promise((resolve, reject)=>{	
			
			var barsJSON = (data);

			var pool4 = poolInst;
//			console.log("store business: ")
// var i = 0;		
			const insertText = 'INSERT INTO bars(\"busiName\", \"yelpID\") '+
			'VALUES($1, $2) '+
			'ON CONFLICT DO NOTHING RETURNING *';
						
			var busName = new String(barsJSON.title).substring(0,140) || null; //arbitrary cut off
			var yelpId = new String(barsJSON.id).substring(0,100) || null;
			
			var insertValues = [];
			insertValues.push(busName);
			insertValues.push(yelpId);	
// console.log(insertValues);
			
			//new postgresql connection
			pool4.connect()
			.then(client2 => {
// console.log('pg-connected4');				
				client2.query(insertText, insertValues, function (err, result){
					client2.release();
					if(err){ console.log(err);
						reject(err);
					} else {
						resolve(result);
console.log("inserted bars: "+ result.rowCount);						
					}
				});//client.query
			})
			.catch(err => console.error('error connecting2', err.stack));
//			.then(() => {pool4.end()});
		}); //promise
	}//store businesses
	
	/*
	appt object:
		timestamp	
		userid	
		yelpid	
		location	
		active
	*/
	//accepts JSON array of yelp businesses, then outputs JSON for client
	function barBuilder(result, opts) {
		return new Promise((resolve, reject) => {
// console.log("barBuilder callback");

			if (!Array.isArray(result)) {
console.log(result);
				reject("input not an array");
			} else {
				var aggregator = [];
				var currentBar = ""; var currentPIndex = -1;
				var totalVotes = 0;
				var vRay = [];
				for (var i = 0; i < result.length; i++) {
					var barId = result[i].id || "";
					if (currentBar !== barId) {
						currentBar = barId;
						aggregator.push({
							id: barId,
							title: result[i].name,
							rating: result[i].rating,
							coordinates: result[i].coordinates,
							price: result[i].price,
							display_phone: result[i].display_phone,
							image_url: result[i].image_url,
							url: result[i].url
						});
						if (opts) {
							let leng = aggregator.length;
							aggregator[(leng - 1)]["appt"] = result[i].appt;
							delete aggregator[(leng - 1)]["appt"].userid;
							delete aggregator[(leng - 1)]["appt"].location;
							delete aggregator[(leng - 1)]["appt"].active;
						}
					}//if current bar
				}//for loop

				if (opts) { console.log(opts); }
				resolve(aggregator);
			}//passes "array" test
		});
	}//barBuilder

		//accepts JSON array of yelp businesses, then outputs JSON for client
		//accepts a "time" to refine db query to "relevant" dates
		function barBuilder2(result, timeframe){
			return new Promise((resolve, reject)=>{
// console.log("barBuilder2 callback");
				if(!Array.isArray(result)){
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
			function promisifier(barData, timeframe){
				return new Promise((resolve, reject) => {
					//query pgsql with bar data
					apptQMaker(barData, timeframe)
					.then((queryArray) => {
						var poolAQ = new pg.Pool(config);
						let text = queryArray[0];
						let values = queryArray[1];
						//connect and query postgresql db
						poolAQ.connect()
						.then(client => {
// console.log('pg-connected: promisifier')
							client.query(text, values, function (err, resultAQ){
								if(err){ 
									console.log("get appts error");
									console.log(resultAQ);
									reject(err);	
								} else{
									let rc = resultAQ.rowCount;
									client.release();
									if(rc == 0){ //resolve an empty array
										resolve([]);
console.log("empty results");
									} else {
										resolve(resultAQ.rows);
									}//else
								}//no error
							});//client.query
						})//pool
						.catch((e) => { console.error(e);});						
					})//after query resolves
					.catch((e) => { console.error(e);})
				});//return statement
			}//promisifier

			//used on each bar object			
			function apptQMaker(barz, timeframe){
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
					if(Array.isArray(barz)){
						//yes> add each barid and text to the arrays
console.log(Array.isArray(barz) + " : is array check : apptQMAKER");
						let cap = barz.length - 1;
						var combNots = barz.reduce( function (acc, cVal, cInd, array) {
							//add the barid
								values.push(cVal.id);
								if(cInd < cap){
									return acc.concat(('$' + (2 + cInd) + ', '));
								}
								else{
									return acc.concat(('$' + (2 + cInd)));
								}	
							}, (text.concat(	' AND yelpid IN ('	))
						);						
						resolve([ combNots.concat(') GROUP BY yelpid'), values]);
					}				
					else{
console.log(Array.isArray(barz) + " : is array check : apptQMAKER");	
						//no>return the text/values:
						resolve([text, values]);					
					}//else
				});//return
			}//apptQMaker
		}//barBuilder2
	
	//search DB for bar data that user owns//'GET' to /bars/db
	this.getAppts = function (req, res) {
// console.log('handler.server.js.getAppts');		
		var pool = new pg.Pool(config);
		function queryMaker(){
			return new Promise((resolve, reject) => {
				//query for only active "true" appointments
				var text = 'SELECT * FROM appts WHERE userid = $1 AND NOT active = false';

				const values = [];
				var uid = req.user.id;
				values.push(uid);

				//check if query has any appts
				if( req.query.hasOwnProperty('appts')		&& Array.isArray(req.query.appts)){
					//yes> add each appt and text to the arrays
console.log(Array.isArray(req.query.appts) + " : is array check");
					let cap = req.query.appts.length - 1;
					var combNots = req.query.appts.reduce( function (acc, cVal, cInd, array) {
							values.push(cVal);
							if(cInd < cap){
								return acc.concat(('$' + (2 + cInd) + ', '));
							}
							else{
								return acc.concat(('$' + (2 + cInd)));
							}	
						}, (text.concat(	' AND _id NOT IN ('	))
					);
					resolve([ combNots.concat(')'), values]);
				}				
				else{
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
				client.query(text, values, function (err, result){
					if(err){					
						res.status(403);
						console.log(err);
						console.log("get appts error");
						res.json({barsFound: "none"});
					}
					let rc = result.rowCount;		
					client.release();
					if(rc == 0){
						res.status(200);
						res.json({barsFound: "none"});
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
						.then(promies =>(barBuilder(promies, true)))
						.then(builtBars => {
							res.json(builtBars);
// console.log("builtBarsVVVV");							
						})
						.catch(e=>{console.log(e + "loopy Loop");});	
											
					}
				});
			})
			.catch(err => console.error('error connecting', err.stack))
			.then(() => pool.end());
		})
		.catch(err => console.error('error getAppts', err.stack))

		//requests single business data from yelp api,
		//TODO qps on a timer
		function yelpSingle(appt, options){
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
	
	this.addAppt = function (req, res) {
		var timeStamp = new String(req.query.date).substring(0,140) || null;
		var yelpId = new String(req.query.bid).substring(0,100) || null;
		var userId = new String(req.user.id).substring(0,140) || null; //arbitrary cut off		
		// create a new user
		const insertText = 'INSERT INTO appts(userid, yelpid, timestamp, location, active) '+
			'VALUES($1, $2, $3, $4, $5) '+
			'RETURNING *';
		const insertValues = [];
		insertValues.push(userId); //id
		insertValues.push(yelpId);
		insertValues.push(timeStamp);

		do{	insertValues.push('{null}'); //ensure length
		} while(insertValues.length < 4);
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

}//BarsHandler

module.exports = BarsHandler;
