"use strict";


module.exports = {
	"^ampache$": require("./response/index.js"),
	"^ampache/album/tracks/(\\d+)$": require("./response/album-tracks.js"),
	"^ampache/albums$": require("./response/albums.js"),
	"^ampache/artist/albums/(\\d+)$": require("./response/artist-albums.js"),
	"^ampache/artists$": require("./response/artists.js"),
	"^ampache/tracks$": require("./response/tracks.js"),
};