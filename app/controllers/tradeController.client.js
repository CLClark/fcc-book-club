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
						/*  date not needed in book app
							let tDay = new Date();
							let timeFrame = new Date(tDay.getFullYear(), tDay.getMonth(), tDay.getDate())
							if (tDay.getHours() >= 20) {
								timeFrame.setDate(timeFrame.getDate() + 1);
							}
						*/
						var request = ('/club/?terms=' + searchValue);// + "&timeframe=" + timeFrame.toISOString());
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
						var request = ('/club/?terms=' + searchValue);// + "&timeframe=" + timeFrame.toISOString());
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

				if(tradeSide == "right"){
					formSide =  "#right-book";
					resultSide = "#poll-view";
					sideId = "prop-wrap";
				} else {
					formSide =  "#left-book";
					resultSide = "#poll-view-request";
					sideId = "req-wrap";
				}

				let that = this;
				
				let leftB = document.querySelector(formSide); //variable
				let currentBook = leftB.querySelector(".poll-wrap-sup");
				let resultList = document.querySelector(resultSide);	//variable

				//add book back to results list
				if(currentBook !== null && currentBook.id !== "wrap-null"){ //variable?									
					currentBook.id = currentBook.getAttribute("tempid");
					currentBook.setAttribute("listener","true");	
					resultList.appendChild(currentBook); //variable?
				} else if ( currentBook.id == "wrap-null"){
					leftB.removeChild(currentBook); //variable?
				}
				//replace form element
				that.setAttribute("tempid",that.id);
				that.id = sideId; //variable				
				if(leftB.childElementCount < 3){
					//place chosen book in form
					leftB.insertBefore(that,leftB.childNodes[0]);
				}
				//set listener flag
				that.setAttribute("listener","false");	
				
				//req-wrap
				//prop-wrap

			}//pickFunction

		}//resHandler

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