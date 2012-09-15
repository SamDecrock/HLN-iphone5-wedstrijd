#!/usr/bin/python



import httplib, urllib
params = urllib.urlencode({"INVITE":"","SOURCE":"", "MAIL":"hoooiii%40neat.be","OPTIN":"0"})
headers = {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:15.0) Gecko/20100101 Firefox/15.0.1',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'nl,en-us;q=0.7,en;q=0.3',
			'Accept-Encoding': 'gzip, deflate',
			'Referer': 'http://www.hln.be/static/nmc/prm/frameset/winelkedag/iphone/win_iphone.html',
			'Cookie': 'cae_browser=desktop',
			'Content-Type': 'application/x-www-form-urlencoded'	}
conn = httplib.HTTPConnection("ims.hln.be:80")
conn.request("POST", "/optiext/optiextension.dll?ID=7v44789DFb3ygyGinE23Kt9EzJF8lO4w0bza79", params, headers)
response = conn.getresponse()
print response.status, response.reason
data = response.read()
conn.close()
print data
