'use strict';

var AUTHLIB = AUTHLIB || (function () {
	var divCB;
	var extScript;
	var authScriptCB;
	var apiAuth = appUrl + '/auth/check';
	var defSearch = null;
	var loader;
	var _args = {}; // private
	//polyfill:
	if (window.NodeList && !NodeList.prototype.forEach) {
		NodeList.prototype.forEach = function (callback, thisArg) {
			thisArg = thisArg || window;
			for (var i = 0; i < this.length; i++) {
				callback.call(thisArg, this[i], i, this);
			}
		};
	}
	return {
		init: function (Args) {
			_args = Args;
			divCB = _args[0]; //MYLIBRARY.bookFormer
			extScript = _args[1] || null; //callback for external script
			authScriptCB = _args[2] || null;
			// some other initialising
			loader = this.loadLock;
			loader(false);
		},

		navi: function () {
			//navigation icon+header
			var homeIcon = document.getElementById('home-icon') || null;
			/**home-icon replacer */
			function makeNaviDiv() {
				var aIcon = document.createElement("a");
				aIcon.href = "/";
				var imgIcon = document.createElement("img");
				imgIcon.src = "/public/img/vota.png";
				imgIcon.style = "height: 80px; width: auto;";
				aIcon.appendChild(imgIcon);
				return aIcon;
			}
			if (homeIcon !== null) {
				//TODO choose to use home icon
				// homeIcon.replaceWith(makeNaviDiv());
			}
			var apiIcon = document.getElementById('api-icon') || null;
			/** api-icon replacer*/
			function makeAPIDiv() {
				var aIcon = document.createElement("a");
				aIcon.href = "https://www.yelp.com";
				var imgIcon = document.createElement("img");
				imgIcon.src = "/public/img/Yelp_trademark_RGB.png";
				imgIcon.id = "api-icon";
				aIcon.appendChild(imgIcon);
				return aIcon;
			}
			if (apiIcon !== null) {
				//TODO choose ot use api icon
				// apiIcon.replaceWith(makeAPIDiv());
			}
			/**set the search bar */
			let clubSearch = document.querySelector("#zipSearch");
			let bookSearch = document.querySelector("#gipSearch");
			// clubSearch.setAttribute("style", "display: none");

			/**clock maker */
			var clock = document.getElementById('clock-time') || null;
			function makeClock() {
				let cWrap = document.createElement("div");
				var now = new Date(Date.now());
				let dayForm = "";
				switch (now.getDay()) {
					case 0: dayForm = "Sunday"; break;
					case 1: dayForm = "Monday"; break;
					case 2: dayForm = "Tuesday"; break;
					case 3: dayForm = "Wednesday"; break;
					case 4: dayForm = "Thursday"; break;
					case 5: dayForm = "Friday"; break;
					case 6: dayForm = "Saturday"; break;
					default: dayForm = "";
				}

				let cFace = document.querySelector("#clockface") || null;
				if (cFace == null) {
					cFace = document.createElement("div");
					cFace.id = "clockface";
					//hh
					let ch1 = document.createElement("img"); ch1.id = "c1"; ch1.className = "c-dig";
					let ch2 = document.createElement("img"); ch2.id = "c2"; ch2.className = "c-dig";
					let cc1 = document.createElement("img"); cc1.id = "c3"; cc1.className = "c-dig";
					//mm
					let cm1 = document.createElement("img"); cm1.id = "c4"; cm1.className = "c-dig";
					let cm2 = document.createElement("img"); cm2.id = "c5"; cm2.className = "c-dig";
					let cc2 = document.createElement("img"); cc2.id = "c6"; cc2.className = "c-dig";
					//ss
					let cs1 = document.createElement("img"); cs1.id = "c7"; cs1.className = "c-dig";
					let cs2 = document.createElement("img"); cs2.id = "c8"; cs2.className = "c-dig";
					cFace.appendChild(ch1); cFace.appendChild(ch2);
					cFace.appendChild(cc1);
					cFace.appendChild(cm1); cFace.appendChild(cm2);
					cFace.appendChild(cc2);
					cFace.appendChild(cs1); cFace.appendChild(cs2);
				}
				else {
					let tMap = Array.from(now.toTimeString().substring(0, 8));
					tMap.forEach((digit, ind) => {
						if (digit == ":") { digit = ""; }
						let digHolder = document.querySelector("#c" + (ind + 1));
						digHolder.src = "/public/img/c" + digit + ".gif";
					});
				}
				let dateStr = document.createElement("span");
				dateStr.innerHTML = now.toDateString();
				cWrap.appendChild(cFace);
				cWrap.appendChild(dateStr);
				return (cWrap.innerHTML);
			}
			if (clock !== null) {
				clock.innerHTML = makeClock();
				var intervalID = window.setInterval(myCallback, 1000);
				function myCallback() {
					clock.innerHTML = makeClock();
				}
			}

			/**listener for refresher */
			let refresher = document.querySelector('#fresh-appts');
			if (refresher !== null) {
				refresher.addEventListener('click', () => {
					//resets all visible appts
					refresher.className = refresher.className + " w3-spin"; //spin the image
					let resetApptsList = document.querySelector("#trades-view");
					if (resetApptsList.hasChildNodes()) {
						while (resetApptsList.firstChild) {
							resetApptsList.removeChild(resetApptsList.firstChild);
						}
						authScriptCB(false);
					} else {
						authScriptCB(false);
					}
				}, false);//event listener "click"
			}//refresher if

		},

		finale: function () {
			let tradesBtn = document.querySelector("#my-trades");
			//execute setup functions based on path
			//trades
			if (window.location.search == "?trades" && tradesBtn !== null) {
				tradesBtn.dispatchEvent(new MouseEvent("click"));
			}
		},

		authScript: function (zipIt) {
			return new Promise((resolve, reject) => {


				/**profile logout div "login-nav" */
				function makeDiv() {
					var newSpan2 = document.createElement("div");
					newSpan2.id = "login-nav";
					var aPro1 = document.createElement("a");
					aPro1.className = "menu";
					aPro1.href = "/profile";
					aPro1.innerHTML = "my Profile";
					var aLog1 = document.createElement("a");
					aLog1.className = "menu";
					aLog1.href = "/logout";
					aLog1.innerHTML = "Logout";
					var pBar = document.createElement("p");
					pBar.innerHTML = "|";
					newSpan2.appendChild(aPro1);
					newSpan2.appendChild(pBar);
					newSpan2.appendChild(aLog1);
					return newSpan2;
				}
				/**login sign-in div  "login-nav"*/
				function makeDefaultDiv() {
					var newSpan = document.createElement("div");
					newSpan.id = "login-nav";
					var aPro = document.createElement("a");
					var aLog = document.createElement("div");
					aLog.className = "btn";
					aLog.id = "login-btn";
					var iBar = document.createElement("img");
					iBar.width = "24";
					iBar.height = "24";
					iBar.src = "https://static.xx.fbcdn.net/rsrc.php/v3/yC/r/aMltqKRlCHD.png";
					iBar.alt = "app-facebook";
					var pText = document.createElement("p");
					pText.innerHTML = "Sign in with Facebook";
					newSpan.appendChild(aPro);
					aPro.appendChild(aLog);
					aLog.appendChild(iBar);
					aLog.appendChild(pText);
					return newSpan;

				}
				//resets navigator placeholder when a new auth call is made
				function resetNavi() {
					var resetSpan = document.createElement("span");
					resetSpan.id = "auth-container";
					return resetSpan;
				}
				/**ask node.js if user is authenticated */
				ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', apiAuth, 8000, function (err, data, status) {
					//reset navi for new auth call
					let resetAttempt = document.querySelector("#login-nav");
					if (resetAttempt !== null) {
						resetAttempt.replaceWith(resetNavi());
					}
					//server response to authentication check		
					var authObj = JSON.parse(data);
					if (authObj == null) { console.log("auth check null "); return; }

					var authNode = document.getElementById('auth-container');
					/* default search bar function, used in nightlife app
						var reg = new RegExp('^(\\d\\d\\d\\d\\d)$');
						if (reg.test(authObj.zipStore) && zipIt) {
						//zipIt prevents search when authScript called elsewhere
							var keyup = new Event('keyup');
							document.querySelector('#zipSearch').value = authObj.zipStore;
							document.querySelector('input#zipSearch').dispatchEvent(keyup);				
						}
					*/
					let navi = document.querySelector("#navi");
					//if user is authenticated:
					if (authObj.authStatus == 1) {
						//"login-nav" div (profile | sign out)
						authNode.replaceWith(makeDiv());
						let dName = document.querySelector("#display-name");
						if (dName !== null) {
							dName.innerHTML = (", <br>" + authObj.displayName);
						}
						descriptUser(authObj);
						/* 	if (document.querySelector("#appts-img") == null) {
							document.querySelector("#trades-navi").insertBefore(makeAppts("My Appointments:"), document.querySelector("#fresh-appts"));
						}*/
						//add "My Books" div
						navi.appendChild(makeMyBooks());
						//add listener
						var booksBtn = document.querySelector("#my-books");
						booksBtn.addEventListener("click", myBooksFn, false);
						//TODO: add "My Trades" div
						navi.appendChild(makeMyTrades());
						//add listener
						var tradesBtn = document.querySelector("#my-trades");
						resolve(tradesBtn.addEventListener("click", myTradesFn, false));

						//search book club
						navi.appendChild(makeSearchClub());
						var clubBtn = document.querySelector("#search-club");
						clubBtn.addEventListener("click", searchClub, false);
						//add Books
						navi.appendChild(makeAddBooks());
						var addsBtn = document.querySelector("#add-books");
						addsBtn.addEventListener("click", addBooks, false);
					}
					//if user is not authenticated
					else {
						//remove appts div "profile-container" because "not authed"
						document.querySelector('#profile-container').remove();
						if (authNode !== null) {
							//add the facebook "sign in" button
							authNode.replaceWith(makeDefaultDiv());
							document.querySelector('#login-btn').addEventListener('click', function () {
								location.replace('/auth/facebook');
							});
						}
						//remove lockpic
						loader(false);
					}//authObj.authStatus else
				}));

				//fills in the profile data
				function descriptUser(userData) {
					let profId = document.querySelector("#profile-id");
					let profUser = document.querySelector("#profile-username");
					let profCity = document.querySelector("#profile-city");
					let profState = document.querySelector("#profile-state");
					if (profId !== null) {
						profId.innerHTML = (userData.userId);
					}
					if (profUser !== null) {
						profUser.innerHTML = (userData.displayName);
					}
					if (profCity !== null) {
						profCity.innerHTML = (userData.city);
					}
					if (profState !== null) {
						profState.innerHTML = (userData.state);
					}
				}

				function tabColourer(selectedTab) {
					let tabs = document.querySelectorAll(".navicon");
					tabs.forEach((thisTab) => {
						thisTab.setAttribute("style", "opacity: .7");
					});
					let fullOpacity = document.querySelector(("#") + selectedTab);
					fullOpacity.setAttribute("style", "");
				}

				function makeMyBooks() {
					//<div id="api-icon" class="navicon">API ICON</div>
					let newDiv = document.createElement("div");
					newDiv.id = "my-books";
					newDiv.className = "navicon";
					let aPro1 = document.createElement("a");
					aPro1.className = "tab";
					//href not used, event listener instead
					// aPro1.href = "/my-books";
					aPro1.innerHTML = "My Books";
					newDiv.appendChild(aPro1);
					return newDiv;
				}//makeMyBooks
				function makeMyTrades() {
					let newDiv = document.createElement("div");
					newDiv.id = "my-trades";
					newDiv.className = "navicon";
					let aPro1 = document.createElement("a");
					aPro1.className = "tab";
					//href not used, event listener instead
					// aPro1.href = "/my-trades";
					aPro1.innerHTML = "My Trades";
					newDiv.appendChild(aPro1);

					//add listener for profile page
					var tradeNavi = document.querySelector("#trades-navi");
					if (tradeNavi !== null) {
						tradeNavi.addEventListener("click", hideButton.bind(tradeNavi), false);
					}
					function hideButton() {
						var trades = document.querySelector("#trades-view");
						if (trades !== null) {
							if (this.innerHTML == "Show Trades") {
								trades.setAttribute("style", "display: unset");
								trades.setAttribute("show-status", true);
								this.innerHTML = "Hide Trades?";
							} else {
								trades.setAttribute("style", "display: none");
								trades.setAttribute("show-status", false);
								this.innerHTML = "Show Trades";
							}
						}
					}//hideButton fn				

					return newDiv;
				}//makeMyTrades
				//execute on btn click
				function myBooksFn() {
					tabColourer("my-books");
					//2. query node for user books
					ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', '/my-books', 8000, function (err, data, status) {
						var booksFound = JSON.parse(data);
						if (err) { console.log(err) }
						else if (booksFound["booksFound"] == "none") {
							let place = document.querySelector("#poll-view");
							place.innerHTML = "No books found.";
						}
						else {
							let resultNote = document.querySelector("#results-text");
							resultNote.innerHTML = "My Books: ";
							// console.log(booksFound);
							divCB(booksFound, 'poll-view', { classText: "owned-book", controls: "delete" }, null);
						}
						//1. declare results div
						//3. display books as results					
						//4. display corollary divs+functions (delete, add, etc)
						// console.log(data);
					}));//ajax call				
				}
				function myTradesFn() {
					//redirect to profile if not there...
					if (window.location.pathname !== '/profile' && window.location.pathname !== '/profile?trades') {
						window.location = "/profile?trades";
					} else {
						// console.log(window.location); //testing
						//GUI notification
						tabColourer("my-trades");
						//Inform User, app is "loading..."
						var tempText = document.querySelector("#trades-text");
						//show the trades list...
						if (document.querySelector("#trades-view").getAttribute("show-status") == "false") {
							document.querySelector("#trades-navi").dispatchEvent(new MouseEvent("click"));
						}
						var proCon = document.querySelector("#profile-container") || null;

						if (tempText !== null) {
							tempText.innerHTML = "Loading...";
							// loader(true); //toggle lock pic
						}
						//query server
						ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', '/my-trades', 8000, function (err, data, status) {
							if (tempText !== null) { tempText.innerHTML = "My Trades:"; }
							console.log(data);
							var tradesFound = JSON.parse(data);

							renderTrades(tradesFound);
						}));//ajax call	

						function renderTrades(tradeData) {
							//no "new" bars compared to pre-delete					 
							if (tradeData.tradesFound == "none") {
								proCon.setAttribute("style", "display: unset");
								// proCon.appendChild(makeAppts("none found"));						
								// loader(false);		//lockpic off			
							}//Found some appointments
							else {
								proCon.setAttribute("style", "display: unset");
								//third arg is div class //divCB is called within barFormer.addElement
								tradeData.sort(function (a, b) {
									let aTime = new Date(a.appt["date_proposed"]);
									let bTime = new Date(b.appt["date_proposed"]);
									return aTime.getTime() - bTime.getTime();
								});
								divCB(tradeData, "trades-view", { "classText": " trade" }, null);
								// addDeleteDiv();						
								// loader(false); //toggle lock pic
							}
							//unspin the icon
							// let refreshIcon = document.querySelector('#fresh-appts')
							// refreshIcon.className = refreshIcon.className.substring(0, (refreshIcon.className.length - 9));
							/****** */
							/* let profSpace = document.querySelector("#profile-container");
								profSpace.setAttribute("style", "display: unset");
								// let tradesList = document.querySelector("#trades-view");
								// let holder = document.createElement("div");
								// holder.innerHTML = tradeData;
								// tradesList.appendChild(holder);
								let tO = [{ title: tradeData}];
								// let tempJson = JSON.parse(tO.toString());
								divCB(tO, 'trades-view', {classText: "trade", controls: null}, null);	
							*/
						}
					}
				}//myTradesFn

				function makeAddBooks() {
					let newDiv = document.createElement("div");
					newDiv.id = "add-books";
					newDiv.className = "navicon";
					let aPro1 = document.createElement("a");
					aPro1.className = "tab";
					//href not used, event listener instead
					// aPro1.href = "/my-trades";
					aPro1.innerHTML = "Add Your <br> Book";
					newDiv.appendChild(aPro1);
					return newDiv;
				}//makeAddBooks
				function addBooks() {
					tabColourer("add-books");
					//hide all unused search bars:
					let allBars = document.querySelectorAll(".sbar");
					allBars.forEach((searchBar) => {
						searchBar.setAttribute("style", "display: none");
					});
					//show our bar:
					document.querySelector("#gipSearch").setAttribute("style", "display: unset");
					//1. replace search bar with "google api search"
					//2. add google search
					//3. form results with listeners(or hrefs) = > server handle add books
					// ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', '/my-books', 8000, function (err, data, status) {
					//1. declare results div			
					//3. display books as results
					//4. display corollary divs+functions (delete, add, etc)
					// process(data);
					// }));//ajax call				
				}
				function makeSearchClub() {
					let newDiv = document.createElement("div");
					newDiv.id = "search-club";
					newDiv.className = "navicon";
					let aPro1 = document.createElement("a");
					aPro1.className = "tab";
					//href not used, event listener instead				
					aPro1.innerHTML = "Search our <br> Books";
					newDiv.appendChild(aPro1);
					return newDiv;
				}//makeSearchClub

				function searchClub() {
					tabColourer("search-club");
					//hide all unused bars:
					let allBars = document.querySelectorAll(".sbar");
					allBars.forEach((searchBar) => {
						searchBar.setAttribute("style", "display: none");
					});
					//show our bar:
					document.querySelector("#zipSearch").setAttribute("style", "display: unset");
				}

				/**			 
				 * @param {String} addText 
				 */
				function makeAppts(addText) {
					var newSpanTxt = document.createElement("img");
					//				newSpanTxt.className = "alternate";
					newSpanTxt.id = "appts-img";
					newSpanTxt.src = "public/img/myappointments.png";
					newSpanTxt.alt = "My Appointments: " + addText;
					newSpanTxt.addEventListener('click', () => {
						let clickEv = new Event('click');
						document.querySelector("#fresh-appts").dispatchEvent(clickEv);
					}, false);
					return newSpanTxt;
				}//makeAppts return

				//query server for my appointments
				function apptFind() {
					//Inform User, app is "loading..."
					var tempText = document.querySelector("#appts-text");
					if (tempText !== null) {
						tempText.innerHTML = "Loading...";
						//toggle lock pic
						loader(true);
					}

					//appointment functions
					var proCon = document.querySelector("#profile-container") || null;
					var request = ('/bars/db?');
					//1. find appts loaded on current page
					var haveAppts = document.querySelector("#trades-view");
					var hApptsList = haveAppts.querySelectorAll(".poll-view-list-poll");
					var ak2Add = [];
					let qString;

					for (var i = 0; i < hApptsList.length; i++) {
						let ak = hApptsList[i].getAttribute("appt-key");
						if (ak !== null) {
							ak2Add.push("appts[]=" + ak);
						}
					}
					if (ak2Add.length > 0) {
						qString = ak2Add.join("&");
						request += qString;
					}
					//2. get appt-key of those appts
					//3. append the appt-keys to the request path
					//4. xhr

					/** GET /bars/db?appts[]= */
					ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', request, false, function (data) {
						if (tempText !== null) { tempText.innerHTML = "My Appointments:"; }
						var apptsFound = JSON.parse(data);
						console.log(apptsFound);
						//no "new" bars compared to pre-delete					 
						if (apptsFound.barsFound == "none") {
							proCon.setAttribute("style", "display: unset");
							// proCon.appendChild(makeAppts("none found"));						
							loader(false);		//lockpic off			
						}
						//Found some appointments
						else {
							proCon.setAttribute("style", "display: unset");
							//third arg is div class //divCB is called within barFormer.addElement
							apptsFound.sort(function (a, b) {
								let aTime = new Date(a.appt["timestamp"]);
								let bTime = new Date(b.appt["timestamp"]);
								return aTime.getTime() - bTime.getTime();
							});
							divCB(apptsFound, "trades-view", { "classText": " appt-wrap-sup" }, null);
							addDeleteDiv();
							//toggle lock pic
							loader(false);
						}
						//unspin the icon
						let refreshIcon = document.querySelector('#fresh-appts')
						refreshIcon.className = refreshIcon.className.substring(0, (refreshIcon.className.length - 9));
					}));

					/**add a delete btn for each poll */
					function addDeleteDiv() {
						var pWrapSup = document.querySelectorAll(".appt-wrap-sup") || null;
						for (var pWrapper of pWrapSup) {
							if (pWrapper.querySelector(".delete-poll") == null) {
								var deletePoll = document.createElement("div");
								deletePoll.className = ("delete-poll");
								var actionDel = document.createElement('a');
								var pollDataDiv = pWrapper.querySelector(".poll-view-list-poll");
								var keyOfPoll = pollDataDiv.getAttribute("appt-key");
								var titleOfPoll = pollDataDiv.getAttribute("poll-title");
								actionDel.setAttribute("appt-key", keyOfPoll);
								actionDel.setAttribute("title", titleOfPoll);
								var pollDel = document.createElement('div');
								pollDel.className = "btn delete-btn";
								pollDel.id = "delete-btn";
								pollDel.innerHTML = "<span class=\"del-text\">remove</span>";
								pollDel.setAttribute("style", "margin: auto;");
								actionDel.appendChild(pollDel);
								deletePoll.appendChild(actionDel);
								pWrapper.appendChild(deletePoll);

								actionDel.addEventListener('click', deleteCB.bind(actionDel), false);

								function deleteCB() {
									var keyS = this.getAttribute("appt-key");
									var titleS = this.title;
									var confirmDel = confirm("Expire your appointment: " + titleS + "?");
									let that = this;
									if (confirmDel == true) {
										ajaxFunctions.ajaxRequestLim('DELETE', '/bars/db?appt=' + keyS, 5000, function (err, response, status) {
											if (err) { console.log("request error \'delete\'"); }
											else {
												let nodeToRemove = that.parentNode.parentNode;
												if (nodeToRemove.className == "poll-wrap-sup appt-wrap-sup") {
													let nPare = nodeToRemove.parentNode;
													nPare.removeChild(nodeToRemove);
												}
												let pollRoot = document.querySelector("#poll-view");
												let resetThis = pollRoot.querySelector("div[appt-key='" + keyS + "']");
												//existing super-bar node
												if (resetThis !== null) {
													resetThis.setAttribute("style", "");
													resetThis.querySelector(".show-text").innerHTML = "click to book...";
													resetThis.querySelector(".show-text").setAttribute("style", "");
													resetThis.removeAttribute("appt-key");
												}
											}//else err
										});
									}
								}//deleteCB
							}//has .delete div child
						}
					}//function addDeelteteltelteltlet
				}//apptFind()
			});
		},

		fbControl: function (cb) {
			window.fbAsyncInit = function () { };
			// Load the SDK asynchronously
			(function (d, s, id) {
				var js, fjs = d.getElementsByTagName(s)[0];
				if (d.getElementById(id)) return;
				js = d.createElement(s); js.id = id;
				js.src = "https://connect.facebook.net/en_US/sdk.js";
				fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));

		},

		chooser: function (passedInFn) {
			var cButtons = document.querySelectorAll(".poll-wrap-sup") || null;
			for (var cButton of cButtons) {
				if (cButton.className !== "poll-wrap-sup appt-wrap-sup") {
					//add a new choice to an existing poll					
					cButton.addEventListener('click', clickHandle.bind(cButton), false);//click listener					
				}//classname check
			}//loop

			/*			Search Result bar clicks (add and remove)			*/
			function clickHandle() {
				//lockpic on
				loader(true);
				var tDay = new Date();
				// tDay.setHours(21); //for testing
				var toDate = new Date(tDay.getFullYear(), tDay.getMonth(), tDay.getDate())
				if (tDay.getHours() >= 20) {
					toDate.setDate(toDate.getDate() + 1);
					// toDate.setDate(toDate.getDate() - 1); //for testing
					// console.log('if passed');
				}
				var keyName = this.querySelector('.poll-view-list-poll');
				let that = this;
				that.querySelector(".show-text").innerHTML = "please hold...";
				//if "app key" check
				if (!that.hasAttribute("appt-key")) {
					//post server for 'this' bar and 'today'					
					ajaxFunctions.ajaxRequestLim('POST', '/bars/db?date=' + toDate.toISOString() + "&" + "bid=" + keyName.getAttribute("poll-key"), 10000,
						function (err, response, status) {
							let respJSON = JSON.parse(response);
							if (status == 403) {
								//lockpic off
								loader(false);
								that.querySelector(".show-text").innerHTML = "Sign in to book...";
								alert("please sign in ...");
								that.removeEventListener('click', clickHandle);
								return;
							}
							else if (respJSON == null) {
								//lockpic off
								loader(false);
								that.querySelector(".show-text").innerHTML = "click to book...";
								alert("please wait...");
								that.removeEventListener('click', clickHandle);
								return;
							}
							else {
								that.setAttribute("style", "border-color: #ebc074; background-color: #f5deb7");
								that.querySelector(".show-text").innerHTML = "booked!";
								that.querySelector(".show-text").setAttribute("style", "color: #f15c00");
								//if keys match
								if (keyName.getAttribute("poll-key") == respJSON["appt"]["yelpid"]) {
									//append the new "appt-key" to this bar div
									that.setAttribute("appt-key", respJSON["appt"]["_id"]);
								}
							}
							//lockpic on
							loader(true);
							//execute AUTHLIB.authScript(false) as a cb
							authScriptCB(false);
						});//ajax
				} else {
					//click action to "unbook" this bar
					//lockpic off
					loader(false);
					deleteCB(that);
				}//else

				function deleteCB(arg) {
					var keyS = arg.getAttribute("appt-key");
					var titleS = arg.title;
					arg.setAttribute("style", "border-color: unset; background-color: unset");
					let zat = arg;
					ajaxFunctions.ajaxRequest('DELETE', '/bars/db?appt=' + keyS, false, function (response2) {

						let pareOut = document.querySelector("#trades-view");
						pareOut.removeChild(pareOut.querySelector('[appt-key=\"' + keyS + '\"').parentNode.parentNode.parentNode);

						zat.querySelector(".show-text").innerHTML = "click to book...";
						zat.querySelector(".show-text").setAttribute("style", "");
						zat.removeAttribute("appt-key");
						//execute AUTHLIB.authScript(false) as a cb
						authScriptCB(false);
					});
					//					 }
				}//deleteCB function			
			}// clickHandle function
		},//chooser

		loadExtScript: function () {
			return new Promise(function (resolve, reject) {
				var s;
				s = document.createElement('script');
				s.src = extScript;
				s.onload = resolve;
				s.onerror = reject;
				document.head.appendChild(s);
			});
		},

		loadLock: function loadLock(boo) {
			let lockPic = document.querySelector('#loading');
			if (boo === true) {
				lockPic.style = "";
				lockPic.setAttribute('lock', "on");
			}
			else if (boo === false) {
				lockPic.style = "display: none";
				lockPic.setAttribute('lock', "off");
			}
			else {
				if (lockPic.getAttribute('lock') == 'on') {
					lockPic.style = "display: none";
					lockPic.setAttribute('lock', "off");
				} else {
					lockPic.style = "";
					lockPic.setAttribute('lock', "on");
				}
			}
		}
	};
})();
