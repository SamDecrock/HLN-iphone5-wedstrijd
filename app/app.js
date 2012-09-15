var querystring = require('querystring');
var http = require('http');
var Step = require('step');
var async = require('async');
var httpget = require('http-get');
var cheerio = require('cheerio');
var url = require('url');
var inspect 	= require('util').inspect



var stop = false;
var count = 9000;

async.whilst(
    function () { return !stop; },
    function (callback) {
    	console.log("jan" + count + "@neat.be");
       	test("jan" + count + "@neat.be", function (err, url) {
       		if(err){
       			console.log(err.stack);
       			stop = true;
       		}else if(url != null){
       			console.log("Found valid url: " + url);
       			stop = true;
       		}

       		count++;

       		callback();
       	});
    },
    function (err) {
      	// done
    }
);



function test (email, callback) {
	Step(
		function () {
			getFormUrl(this);
		},

		function (err, url) {
			if(err) throw err;

			play(url, email, this);
		},

		function (err, htmlbody) {
			if(err) callback(err);
			else{
				//console.log(htmlbody);
				//console.log(htmlbody.indexOf("Jammer"));

				if(htmlbody.indexOf("Jammer") == -1){
					var $ = cheerio.load(htmlbody);
					var url = $("form").attr("action");

					callback(null, url);
				}else{
					callback(null, null);
				}
			}
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


function play(urlString, email, callback) {

	var response = "";


	var reqUrl = url.parse(urlString);

	var options = {
		'INVITE': '',
		'SOURCE': '',
		'MAIL': email,
		'OPTIN': 0
	}

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