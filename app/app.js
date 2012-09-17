var querystring = require('querystring');
var http = require('http');
var Step = require('step');
var async = require('async');
var httpget = require('http-get');
var cheerio = require('cheerio');
var url = require('url');
var inspect 	= require('util').inspect
var fs = require('fs');

var threads = 0;


/**
 * Deze PoC laat toe om mee te spelen met de HLN iPhone 5 quiz en het winnend formulier direct in te vullen
 *
 * Node.js en bovenstaande packages zijn vereist.
 */

var settings = {
	getEmail: function (counter) {
		return "name" + counter + "@xxx.be"; // email patroon
	},

	getFormdata: function(email, bonusquestion) {
		return {
			'MAIL'			: email,
			'GENDER'		: 'M', 				// geslacht
			'FIRST_NAME'	: '', 				// voornaam
			'NAME'			: '',				// familienaam
			'STREET'		: '',				// straat
			'HOUSENO'		: 0,				// huisnummer
			'HOUSENOEXT1'	: 0,				// busnummer
			'ZIPCODE'		: 0,				// postcode
			'CITY'			: '',				// stad
			'SELECTOR'		: '',				// geboortedatum vb 31+12+1995
			'BIRTH_DATE'	: '',				// geboortedatum vb 1995-12-31
			'MOBILE_NUMBER'	: '',				// telefoonnummer
			'Q'				: 1,				// antwoord op de vraag selectie
			'SQ'			: bonusquestion,
			'SUBMIT'		: 'Verzend'
		}
	}
}

// 10 is het max aantal keer dat je wil winnen
start(10);










function start (maxWinnings) {

	var stop = false;
	var count = 0;
	var winnings = 0;

	async.whilst(
	    function () { return !stop; },
	    function (callback) {
	    	var email = settings.getEmail(count);
	    	threads++;

	       	playOnce(email, function (err, success) {
	       		if(err){
	       			console.log(err.stack);
	       			stop = true;
	       		}else if(success){
	       			winnings++;
	       			if(winnings >= maxWinnings){
		       			console.log("Achieved " + winnings + " STOPPING...");
		       			stop = true;
		       		}
	       		}
	       		threads--;

	       		//count++;
	       		//callback();  		
	       	});



	       	waitForThreads(100, function(){
				count++;
		       	callback();
	       	});
	    },
	    function (err) {
	      	console.log("Stopped!");
	    }
	);

}


function waitForThreads(maxThreads, callback) {
	if(threads < maxThreads){
		callback();
	}else{
		setTimeout(function(){
			waitForThreads(maxThreads, callback);
		}, 400);
	}
}



function playOnce (email_, callback) {
	var email = email_;
	var bonusquestion;

	Step(
		function () {
			getFormUrl(this);
		},

		function (err, url) {
			if(err) throw err;

			var options = {
				'INVITE': '',
				'SOURCE': '',
				'MAIL': email,
				'OPTIN': 0
			}

			doPost(url, options, this);
		},

		function (err, htmlbody) {
			if(err) throw err;

			console.log("tried " + email);

			//If goeie pagina:
			if(htmlbody.indexOf("Jammer") == -1){

				var winningpage = "winningpage"+email+".html";
				fs.writeFile(winningpage, htmlbody, function(err) {
				    if(err) {
				        console.log(err.stack);
				    } else {
				        console.log("Saved " + winningpage);
				    }
				});

				this(null, htmlbody);
			}else{
				this(null, null);
			}

		},


		function (err, winningbody) {
			if(err) throw err;

			if(winningbody) {

	  			var $ = cheerio.load(winningbody);
				var div = $("#container #left").html();

				var start = div.indexOf("FORM") + 27;
				var stop = div.indexOf(">", start) -1 ;

				var postUrl = div.substring(start, stop);

				console.log(postUrl);


				//Posting my data to the url:
				bonusquestion = Math.floor(Math.random()*8000) + 367; // some random number betwen 367 and 8367

				var options = settings.getFormdata(email, bonusquestion);

				doPost(postUrl, options, this);

			}else{
				this(null, null);
			}
		},

		function (err, thanksbody) {
			if(err) throw err;

			if (thanksbody) {
				
				var filledinpage = "filledinpage" + email + "_" + bonusquestion + ".html";
   				fs.writeFile(filledinpage, thanksbody, function(err) {
				    if(err) {
				        console.log(err);
				    } else {
				        console.log("Filled in and saved page to " + filledinpage);
				    }
				})

				this(null, true);
			}else{
				this(null, false);
			}
		},

		function (err, success) {
			callback(err, success);
		}
	);
}




function getFormUrl (callback) {
	Step(
		function () {
			httpget.get({url:'http://www.hln.be/static/nmc/prm/frameset/winelkedag/iphone/win_iphone.html'}, this);

		},

		function (err, res) {
			if(err) callback(err);
			else{
				var $ = cheerio.load(res.buffer);
				var url = $("form").attr("action");
				callback(null,url);
			}
		}
	);
}



function doPost(urlString, options, callback) {
	var response = "";

	var reqUrl = url.parse(urlString);

	var params = querystring.stringify(options);

	var post_options = {
		host: reqUrl.hostname,
		port: reqUrl.port || 80,
		path: reqUrl.path,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': params.length
		}
	}; 

	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			response += chunk;
		});

		res.on('end', function (err) {
			callback(null, response);
		});

		res.on('close', function (err) {
			callback(err);
		});
	});

	post_req.write(params);
	post_req.end();
}

