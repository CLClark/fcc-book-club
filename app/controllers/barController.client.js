'use strict';

var MYLIBRARY = MYLIBRARY || (function () {
	var _args = {}; // private
	var functionCB;
	var formerCB;
	return {
		init: function (Args) {
			_args = Args;
			// some other initialising
			functionCB = _args[0];
			formerCB = _args[1];
		},
		barProducer: function (passedInFunction) {
			var yelper = new Event('yelpApi');
			// Listen for the event.
			var staticText = document.querySelector('#poll-view') || null;
			if (staticText !== null) {
				document.querySelector('#poll-view').addEventListener('yelpApi', function (e) {
					this.innerHTML = "now finding, Please hold...";
				}, false);
			}

			document.querySelector('input#zipSearch').addEventListener("keyup", function () {
				var i = document.querySelector('#zipSearch').value;
				var reg = new RegExp('^(\\d\\d\\d\\d\\d)$');
				if (reg.test(i)) {
					// Dispatch the event.
					document.querySelector('#poll-view').dispatchEvent(yelper);
					barFind(i);
				}
				function barFind(searchValue) {
					let tDay = new Date();
					let timeFrame = new Date(tDay.getFullYear(), tDay.getMonth(), tDay.getDate())
					if (tDay.getHours() >= 20) {
						timeFrame.setDate(timeFrame.getDate() + 1);
					}
					var request = ('/bars/?zip=' + searchValue + "&timeframe=" + timeFrame.toISOString());
					ajaxFunctions.ready(ajaxFunctions.ajaxRequestLim('GET', request, 7000, function (err, data, status) {
						document.querySelector('#poll-view').innerHTML = "";
						var barsFound = JSON.parse(data);
						console.log(barsFound);
						//barFormer callback
						functionCB(barsFound, 'poll-view', null, null);
						passedInFunction();
						//					formerCB();
					}));
				};
			});
		},
		barFormer: function (jsonData, parentIdString, optionsBF, cb) {
			var pollView = document.getElementById(parentIdString);  //ul		
			if (pollView.hasChildNodes()) {
				//clears the existing...
				// while (pollView.firstChild) {
				// 	pollView.removeChild(pollView.firstChild);
				// }
			}
			//turn json into html elements
			for (var i = 0; i < jsonData.length; i++) {
				//create a div for each poll
				var pId = ("poll-").concat(i);
				var jone = jsonData[i];
				addElement(pId, pollView, jone, optionsBF, cb);
				if (jone.count > 0) {
					let cNodes = pollView.childNodes;
					let lastChild = pollView.childNodes[cNodes.length - 1];
					pollView.removeChild(lastChild);
					pollView.insertBefore(lastChild, pollView.childNodes[0]);
				}
			}

			function addElement(divName, parent, polljone, options) {
				var pollCopy = JSON.parse(JSON.stringify(polljone));
				var pollChoices = pollCopy.pollData;
				//console.log(pollChoices);
				// create a new div element 
				var newWrapSup = document.createElement("div");
				newWrapSup.className = "poll-wrap-sup";
				newWrapSup.id = ("poll-wrap-sup-" + pollCopy["id"]);

				//contains info divs for appt
				var newWrapInfo = document.createElement("div");
				newWrapInfo.className = "poll-wrap-info";

				var titleDiv = document.createElement("div");
				titleDiv.className = "poll-title";
				var titleA = document.createElement("a");
				titleA.className = "poll-title";
				titleA.innerHTML = polljone.title;
				titleA.href = (pollCopy["url"]);
				titleDiv.appendChild(titleA);
				newWrapInfo.appendChild(titleDiv);

				//div to show number of appts
				var countDiv = document.createElement("div");
				countDiv.className = "appt-count";
				if (polljone.count >= 0) {
					countDiv.innerHTML = polljone.count + " GOING";
					newWrapInfo.appendChild(countDiv);
				}

				var newWrap = document.createElement("div");
				newWrap.className = "poll-wrap";
				newWrapInfo.appendChild(newWrap);
				//append info to poll-wrap-sup
				newWrapSup.appendChild(newWrapInfo);
				//background image
				var newWrapPic = document.createElement("a");
				newWrapPic.href = (pollCopy["url"]);
				newWrapPic.className = "poll-wrap-pic";
				newWrapPic.setAttribute("style",
					"background-image: url(" + pollCopy["image_url"] + ")");
				newWrapSup.appendChild(newWrapPic);


				//divs: choice buttons
				var contDiv = document.createElement("div");
				contDiv.className = "container";
				contDiv.id = "vote-controls";

				//poll placeholder
				var newDiv = document.createElement("li");
				newDiv.id = divName;
				newDiv.className = "poll-view-list-poll";
				//newDiv.innerHTML = "";
				newDiv.setAttribute("poll-key", polljone.id);
				newDiv.setAttribute("poll-title", polljone.title);
				newDiv.setAttribute("poll-data", JSON.stringify(polljone.pollData));

				//if we're making an "Appointment" element, add the info
				if (polljone.appt) {
					newDiv.setAttribute("appt-key", polljone.appt["_id"]);
					newDiv.setAttribute("appt-time", polljone.appt["timestamp"]);
					let apptDate = new Date(Date.parse(polljone.appt["timestamp"]));
					let dayForm = "";
					switch (apptDate.getDay()) {
						case 0: dayForm = "Sunday"; break;
						case 1: dayForm = "Monday"; break;
						case 2: dayForm = "Tuesday"; break;
						case 3: dayForm = "Wednesday"; break;
						case 4: dayForm = "Thursday"; break;
						case 5: dayForm = "Friday"; break;
						case 6: dayForm = "Saturday"; break;
						default: dayForm = "";
					}

					var nowDate = new Date();
					//comparer date
					var seenDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

					//seen date is "today" 2am onward
					if (nowDate.getHours() >= 2) {
						// seenDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
					} else {
						//seen date is "yesterday" before 6am
						seenDay.setDate(seenDay.getDate() - 1);
					}
					//compare appt to framed "today"
					if (apptDate.getTime() < seenDay.getTime()) {
						showTextMaker("expired")
							.then(res => {
								res.className = "show-text expired-text";
								newWrap.appendChild(res);
								//set the main appt div to class 'expired'
								newWrapSup.className = newWrapSup.className + " expired";
							})
							.catch(e => console.log(e));
					} else {
						showTextMaker(dayForm)
							.then(res => {
								res.className = "show-text appt-text"
								newWrap.appendChild(res);
							})
							.catch(e => console.log(e));
					}
					console.log(dayForm);
					console.log(seenDay.toDateString());
				}

				newWrap.appendChild(newDiv);

				function showTextMaker(inner) {
					return new Promise((resolve, reject) => {
						var showText = document.createElement("span");
						showText.className = "show-text";
						showText.style = "color";
						if (inner) {
							showText.innerHTML = inner;
							resolve(showText);
						}
						else {
							showText.innerHTML = "click to book...";
							resolve(showText);
						}
						reject("error in showTextMaker");
					});
				}

				//add++i to poll-view ul               
				if (options == null) {
					showTextMaker(false)
						.then(res => newWrap.appendChild(res))
						.catch(e => console.log(e));
					parent.appendChild(newWrapSup);
				}
				else {
					newWrapSup.className = newWrapSup.className + options.classText;
					// var insertedNode = parentNode.insertBefore(newNode, referenceNode);
					if (parent.hasChildNodes()) {
						let firstNode = parent.childNodes[0];
						parent.insertBefore(newWrapSup, firstNode);
					} else {
						parent.appendChild(newWrapSup);
					}
				}
				if (cb !== null) {
					try { cb(); } catch (TypeError) { console.log("no cb provided"); }
				}
			} //add element
		}//barFormer
	}; //return statement
}());

