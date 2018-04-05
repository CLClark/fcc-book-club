'use strict';

var TRADES = TRADES || (function () {
	var _args = {}; // private
	var functionCB;
	var formerCB;
	var resultCB;
	var arg3;
	var thirdCB;
	return {
		init: function (Args) {
			_args = Args;
			// some other initialising
			functionCB = _args[0];
			resultCB = _args[1];
			arg3 = _args[2];	
		},//init

		myBookForm: function () {
			return new Promise((resolve, reject) => {
				//query to find my book
				var yelper = new Event('bookApi');
				// Listen for the event.
				var staticText = document.querySelector('#poll-view') || null;
				if (staticText !== null) {
					document.querySelector('#poll-view').addEventListener('bookApi', function (e) {
						this.innerHTML = "now finding, Please hold...";
					}, false);
				}
				document.querySelector('input#probook').addEventListener("keypress", function (e) {
					var key = e.which || e.keyCode;
					var i = document.querySelector('#probook').value;
					if (key === 13) { // 13 is enter					
						// code for enter
						console.log("fired probook input: " + i);
						let userInput = i.toUpperCase();
						var reg = new RegExp('^\S{0,50}$'); //search term less than 50				
						// if (reg.test(i)) {

						//execute the GET
						bookFind(userInput);

						/* handle gui (tab)	 */					
						// tabColourer("search-club");
						// document.querySelector('#probook').value = "";
						// Dispatch "results" loading event
						document.querySelector('#poll-view').dispatchEvent(yelper);
						// }
					}

					function bookFind(searchValue) {
						var request = ('/my-books/?terms=' + searchValue);// + "&timeframe=" + timeFrame.toISOString());
						ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', request, 7000, function (err, data, status) {
							if (err) {
								console.log("request error")
							} else {
								document.querySelector('#poll-view').innerHTML = "";
								var booksFound = JSON.parse(data);
								console.log(booksFound);

								functionCB(booksFound, 'poll-view', {classText: " my-book-sup"}, resultCB);
							}
							/* 
								//barFormer callback
								functionCB(barsFound, 'poll-view', null, null);
								passedInFunction();
								//					formerCB();
							*/
						}));
					};

					function tabColourer(selectedTab) {
						let tabs = document.querySelectorAll(".navicon");
						tabs.forEach((thisTab) => {
							thisTab.setAttribute("style", "opacity: .7");
						});
						let fullOpacity = document.querySelector(("#") + selectedTab);
						if (fullOpacity !== null) {
							fullOpacity.setAttribute("style", "");
						}
					}
				});

			}); //prom			
		},//myBookForm

		reqBookForm: function () {
			return new Promise((resolve, reject) => {
				//query to find my book
				var yelper = new Event('bookApi');
				// Listen for the event.
				var staticText = document.querySelector('#poll-view-request') || null;
				if (staticText !== null) {
					document.querySelector('#poll-view-request').addEventListener('bookApi', function (e) {
						this.innerHTML = "now finding, Please hold...";
					}, false);
				}
				document.querySelector('input#reqbook').addEventListener("keypress", function (e) {
					var key = e.which || e.keyCode;
					var i = document.querySelector('#reqbook').value;
					if (key === 13) { // 13 is enter					
						// code for enter
						console.log("fired probook input: " + i);
						let userInput = i.toUpperCase();
						var reg = new RegExp('^\S{0,50}$'); //search term less than 50				
						// if (reg.test(i)) {

						//execute the GET
						bookFind(userInput);

						/* handle gui (tab)	 */					
						// tabColourer("search-club");
						// document.querySelector('#reqbook').value = "";
						// Dispatch "results" loading event
						document.querySelector('#poll-view-request').dispatchEvent(yelper);
						// }
					}

					function bookFind(searchValue) {
						/*  date not needed in book app
							let tDay = new Date();
							let timeFrame = new Date(tDay.getFullYear(), tDay.getMonth(), tDay.getDate())
							if (tDay.getHours() >= 20) {
								timeFrame.setDate(timeFrame.getDate() + 1);
							}
						*/
						//exclude the user in query parameters (don't want user to request their own book)
						var request = ('/club/?terms=' + searchValue + '&exclude=user');// + "&timeframe=" + timeFrame.toISOString());
						ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', request, 7000, function (err, data, status) {
							if (err) {
								console.log("request error")
							} else {
								document.querySelector('#poll-view-request').innerHTML = "";
								var booksFound = JSON.parse(data);
								console.log(booksFound);

								functionCB(booksFound, 'poll-view-request', {classText: " req-book-sup"}, resultCB);
							}
							/* 
								//barFormer callback
								functionCB(barsFound, 'poll-view', null, null);
								passedInFunction();
								//					formerCB();
							*/
						}));
					};

					function tabColourer(selectedTab) {
						let tabs = document.querySelectorAll(".navicon");
						tabs.forEach((thisTab) => {
							thisTab.setAttribute("style", "opacity: .7");
						});
						let fullOpacity = document.querySelector(("#") + selectedTab);
						if (fullOpacity !== null) {
							fullOpacity.setAttribute("style", "");
						}
					}
				});

			}); //prom			
		}, //reqBookForm

		//add "choose" functionality to results
		resHandler:  function(){
			let resList = document.querySelectorAll(".poll-view-list .poll-wrap-sup");
			resList.forEach((bookRes) => {
				if(bookRes.getAttribute("listener") !== "true"){
					var side;
					if(bookRes.classList.contains("req-book-sup")){
						side = "left";
					} else {
						side = "right";
					}					
					bookRes.addEventListener("click", pickFunction.bind(bookRes, side), false);
					bookRes.setAttribute("listener","true");
				}				
			});

			function pickFunction(tradeSide) {
				var formSide;
				var resultSide;
				var sideId;			
				var formInput;	
				var sectionTitle;

				if(tradeSide == "right"){
					formSide =  "#right-book";
					resultSide = "#poll-view";
					sideId = "prop-wrap";
					formInput = "#propinput";
					sectionTitle = "#proposed-title";
				} else {
					formSide =  "#left-book";
					resultSide = "#poll-view-request";
					sideId = "req-wrap";
					formInput = "#reqinput";
					sectionTitle = "#requested-title";
				}

				let that = this;
				
				let leftB = document.querySelector(formSide); //variable
				let currentBook = leftB.querySelector(".poll-wrap-sup");
				let resultList = document.querySelector(resultSide);	//variable
				let formField = document.querySelector(formInput); //var				
				
				//add book back to results list
				if(currentBook !== null && currentBook.id !== "wrap-null"){ //variable?									
					currentBook.id = currentBook.getAttribute("tempid");
					currentBook.setAttribute("listener", "true");
					resultList.appendChild(currentBook); //variable?							
				} else if (currentBook.id == "wrap-null") {
					leftB.removeChild(currentBook); //variable?
				}
				//update form input	
				var dataDiv = that.querySelector(".poll-view-list-poll");
				if(dataDiv != null){
					var bookJson = JSON.parse(dataDiv.getAttribute("book-data"));
					formField.setAttribute("value", bookJson.id);
					// console.log(bookJson.id); //testing
				}				
				//replace gui element (book)
				that.setAttribute("tempid",that.id);
				that.id = sideId; //variable				
				if(leftB.childElementCount < 3){
					//place chosen book in form
					leftB.appendChild(that);
				}
				//update gui title
				let secTitle = document.querySelector(sectionTitle);
				secTitle.innerHTML = that.querySelector(".poll-title").innerHTML;

				//set listener flag
				that.setAttribute("listener","false");	
				
				//req-wrap
				//prop-wrap

			}//pickFunction
	
		},//resHandler

		sufInit: function () {
			// console.log(window.location); //testing
			if(window.location.search == ""){
				//new trade
			} else{
				document.querySelector("#tradefrm2").setAttribute("style","display: none");
			}
			/* //prevent default submit in form...
			var formPrevent = document.querySelector("#tradefrm2");
			formPrevent.addEventListener("submit", listenerNullifier);
			function listenerNullifier(evt) {
				evt.preventDefault();
				console.log("did not submit form");
				return false;
			}
			//remove prevent when using button
			var subButton = document.querySelector("#frmSub");
			subButton.addEventListener("click", function(){
				formPrevent.removeEventListener("submit", listenerNullifier)
				let subEv = new Event("submit");
				formPrevent.dispatchEvent(subEv);
			});		 
			*/

			//Code to do some code stuff or other or so... so... yeah.
			let tradeId = window.location.search.split("=")[1];
			if (tradeId.length == 36) {
				//get the trade data from the id
				queryServer(tradeId)
					.then((foundTrade) => {

						console.log(foundTrade);
						var tradeStatus = foundTrade["status"];
						var tradeIdSpace = document.querySelector("#trade-id");
						if (tradeIdSpace !== null) {
							tradeIdSpace.innerHTML = foundTrade["id"];
						}
						var tradeStat = document.querySelector("#trade-status");
						if (tradeStat !== null){
							tradeStat.innerHTML = tradeStatus;							
						}
						//handle trade status buttons
						if(tradeStatus == "completed"){
							//remove? any interaction buttons
							// or do nothing
						}
						else if(tradeStatus == "proposed"){
							//allow non-proposed party to "accept" (requested party / rec)
							//allow all parties to edit
							//trade > proposed
						}
						else if(tradeStatus == "accepted"){
							//allow proposers to confirm:
							//trade > completed
						}
						else if(tradeStatus == "rejected"){
							//allow proposer to edit and repropose:
							//trade > proposed
						}						

						var leftSpace = document.querySelector("#left-book > #wrap-null");
						var rightSpace = document.querySelector("#right-book > #wrap-null");

						//render the "left" book in the formspace (requested book)
						if (leftSpace !== null) {	
							renderSingle(foundTrade["pro_ownership"],"requested")
							.then(() => {
								if(rightSpace !== null){
									renderSingle(foundTrade["rec_ownership"],"mine");
								}
							}).catch((e) => { console.log(e) });
						} else if (rightSpace !==null){
							renderSingle(foundTrade["rec_ownership"],"mine")
							.catch((e) => { console.log(e) });
						}

						function renderSingle(ownId, tradeOrientation) {
							return new Promise((resolve, reject) => {
								let parentSpace;
								let classString;
								if (tradeOrientation == "requested") {
									parentSpace = "left-book";
									classString = " req-book-sup";
								} else if (tradeOrientation == "mine") {
									parentSpace = "right-book";
									classString = " my-book-sup";
								}
								//exclude the user in query parameters (don't want user to request their own book)
								let request = ('/club/?ownership=' + ownId);// + "&timeframe=" + timeFrame.toISOString());
								ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', request, 7000, function (err, data, status) {
									if (err) {
										console.log("request error" + err)
										reject(err);
									} else {
										// document.querySelector('#poll-view-request').innerHTML = "";
										var booksFound = JSON.parse(data);
										console.log(booksFound);
										//functionCB(booksFound, parentSpace, { classText: classString }, null); //resultCB);
										resolve(functionCB(booksFound, parentSpace, { classText: classString }, null));
									}
									/* 
										//barFormer callback
										functionCB(barsFound, 'poll-view', null, null);
										passedInFunction();
										//					formerCB();
									*/
								}));

							});
						}//renderSingle
					})
					.catch((e) => { console.log(e) });

				function queryServer(theTradeId) {
					return new Promise((resolve, reject) => {
						//query server with trade id
						ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', ('/my-trades?' + 'singleId=' + theTradeId), 8000, function (err, data, status) {
							if(err){
								reject(err);
							}
							var tradeFound = JSON.parse(data);
							resolve(tradeFound[0]);
						}));//ajax call							
					});//prom
				}//queryServer
			}

		}//sufInit

		/**
		 * Query Node for current Trade(s)
		 * 
		 * Populate response data into Form		 * 
		 * 
		 * Add search eventlisteners
		 * 
		 * Handle search queries (+ server side)
		 * 
		 * Submit form + respond...
		 */





	}; //return statement
}());