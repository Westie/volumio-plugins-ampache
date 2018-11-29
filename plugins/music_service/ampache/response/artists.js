"use strict";

var libQ = require("kew");
var querystring = require("querystring");


/**
 *	Constructor
 */
function Response(plugin)
{
	this.plugin = plugin;
	this.ampache = plugin.ampache;
	this.logger = plugin.logger;
}


/**
 *	Run
 */
Response.prototype.run = function(path, qs)
{
	var rpp = parseInt(qs.rpp) || 10;
	var p = parseInt(qs.p) || 0;
	
	var request = {
		action: "artists",
		offset: rpp * p,
		limit: rpp
	};
	
	if(typeof qs.filter !== "undefined")
		request.filter = qs.filter;
	
	var defer = libQ.defer();
	var items = [];
	
	var data = {
		navigation: {
			lists: [
				{
					availableListViews: [
						"list",
						"grid",
					],
					items: items
				}
			],
			prev: {
				uri: this.plugin.getLastUri()
			}
		}
	};
	
	var logger = this.logger;
	
	this.ampache.call_api(request, function(err, body)
	{
		var feed = [];
		
		if(typeof body["@"] !== "undefined")
			feed = [ body ];
		else if(typeof body["#"] !== "undefined")
			feed = [];
		else
			feed = body;
		
		items.push({
			service: "ampache",
			type: "folder",
			title: "Previous page",
			artist: "",
			album: "",
			icon: "fa fa-arrow-circle-left",
			uri: path + "?" + querystring.stringify(Object.assign({}, qs, { p: Math.max(p - 1, 0) }))
		});
		
		var keys = Object.keys(feed);
		
		for(var i in keys)
		{
			var row = feed[keys[i]];
			var id = parseInt(row["@"].id);
			
			items.push({
				service: "ampache",
				type: "folder",
				title: row.name,
				artist: row.name,
				album: "",
				icon: "fa fa-user-alt",
				uri: "ampache/artist/albums/" + id
			});
		}
		
		if(keys.length > 0)
		{
			items.push({
				service: "ampache",
				type: "folder",
				title: "Next page",
				artist: "",
				album: "",
				icon: "fa fa-arrow-circle-right",
				uri: path + "?" + querystring.stringify(Object.assign({}, qs, { p: Math.max(p + 1, 0) }))
			});
		}
		
		return defer.resolve(data);
	});
	
	return defer.promise;
}


/**
 *	Export
 */
module.exports = Response;