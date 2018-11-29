"use strict";

var libQ = require("kew");


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
Response.prototype.run = function(path, qs, album_id)
{
	var request = {
		action: "album_songs",
		filter: album_id
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
		var feed = body.song;
		var keys = Object.keys(feed);
		
		for(var i in keys)
		{
			var row = feed[keys[i]];
			var id = parseInt(row["@"].id);
			
			items.push({
				service: "ampache",
				type: "song",
				title: row.name,
				artist: row.artist["#"],
				album: row.album["#"],
				albumart: row.art,
				uri: row.url
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