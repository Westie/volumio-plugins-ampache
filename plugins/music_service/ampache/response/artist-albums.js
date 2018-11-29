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
Response.prototype.run = function(path, qs, artist_id)
{
	var rpp = parseInt(qs.rpp) || 10;
	var p = parseInt(qs.p) || 0;
	
	var request = {
		action: "artist_albums",
		filter: artist_id
	};
	
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
	
	this.ampache.call_api(request, function(err, body)
	{
		var feed = body.album;
		
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
				artist: row.artist["#"],
				album: row.name,
				albumart: row.art,
				uri: "ampache/album/tracks/" + id
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