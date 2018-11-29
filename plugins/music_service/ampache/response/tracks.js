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
Response.prototype.run = function(uri, rpp, p)
{
	console.log(uri, rpp, p);
	
	var data = {
		navigation: {
			lists: [
				{
					"availableListViews": [
						"list"
					],
					"items": [
						{
							service: "ampache",
							type: "ampache-category",
							title: "Song Titles",
							artist: "",
							album: "",
							icon: "fa fa-folder-open-o",
							uri: "ampache/tracks/rpp200/p0"
						},
						{
							service: "ampache",
							type: "ampache-category",
							title: "Albums",
							artist: "",
							album: "",
							icon: "fa fa-folder-open-o",
							uri: "ampache/albums/rpp200/p0"
						},
						{
							service: "ampache",
							type: "ampache-category",
							title: "Artists",
							artist: "",
							album: "",
							icon: "fa fa-folder-open-o",
							uri: "ampache/artists/rpp200/p0"
						}
					]
				}
			],
			"prev": {
				uri: "ampache"
			}
		}
	};
	
	return libQ.resolve(data);
}


/**
 *	Export
 */
module.exports = Response;