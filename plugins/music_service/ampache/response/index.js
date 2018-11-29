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
	var p = 0;
	var rpp = 202;
	
	var data = {
		navigation: {
			lists: [
				{
					availableListViews: [
						"list",
						"grid",
					],
					items: [
						{
							service: "ampache",
							type: "folder",
							title: "Song Titles",
							artist: "",
							album: "",
							icon: "fa fa-folder-open-o",
							uri: "ampache/tracks?" + querystring.stringify({ p: p, rpp: rpp })
						},
						{
							service: "ampache",
							type: "folder",
							title: "Albums",
							artist: "",
							album: "",
							icon: "fa fa-folder-open-o",
							uri: "ampache/albums?" + querystring.stringify({ p: p, rpp: rpp })
						},
						{
							service: "ampache",
							type: "folder",
							title: "Artists",
							artist: "",
							album: "",
							icon: "fa fa-folder-open-o",
							uri: "ampache/artists?" + querystring.stringify({ p: p, rpp: rpp })
						}
					]
				}
			],
			prev: {
				uri: this.plugin.getLastUri()
			}
		}
	};
	
	return libQ.resolve(data);
}


/**
 *	Export
 */
module.exports = Response;