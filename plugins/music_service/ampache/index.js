"use strict";

var AmpacheSession = require("ampache");
var config = new (require("v-conf"))();
var exec = require("child_process").exec;
var execSync = require("child_process").execSync;
var fs = require("fs-extra");
var libQ = require("kew");
var querystring = require("querystring");
var Router = require("./router");


/**
 *	Constructor
 */
function ControllerAmpache(context)
{
	var self = this;
	
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
	this.lastUri = null;
}


/**
 *	Start of volumio
 */
ControllerAmpache.prototype.onVolumioStart = function()
{
	var file = this.commandRouter.pluginManager.getConfigurationFile(this.context, "config.json");
	
	this.config = new (require("v-conf"))();
	this.config.loadFile(file);
	
	return libQ.resolve();
}


/**
 *	Start of this volumio plugin
 */
ControllerAmpache.prototype.onStart = function()
{
	var defer = libQ.defer();
	var self = this;
	
	var username = this.config.get("username");
	var password = this.config.get("password");
	var endpoint = this.config.get("endpoint");
	
	this.ampache = new AmpacheSession(username, password, endpoint);
	this.active = false;
	this.session = false;
	
	this.ampache.authenticate(function(err, body)
	{
		if(err)
		{
			defer.reject();
		}
		else
		{
			self.active = true;
			self.session = body;
			self.addToBrowseSources();
			
			defer.resolve();
		}
	});
	
	// set up timer
	var callback = function()
	{
		self.pingTimer = setTimeout(function()
		{
			self.ampache.ping();
			self.logger.info("Ping to ampache server");
			
			return callback();
		}, 5 * 60 * 1000);
	};
	
	return defer.promise;
}


/**
 *	Get configuration files
 */
ControllerAmpache.prototype.getConfigurationFiles = function()
{
	return [ "config.json" ];
}


/**
 *	Save configuration files
 */
ControllerAmpache.prototype.saveAmpacheAccount = function(data)
{
	var defer = libQ.defer();
	
	this.config.set("username", data["username"]);
	this.config.set("password", data["password"]);
	this.config.set("endpoint", data["endpoint"]);
	
	this.commandRouter.pushToastMessage("success", "Configuration update", "The configuration has been successfully updated");
	
	return defer.resolve();
};


/**
 *	Get UI config
 */
ControllerAmpache.prototype.getUIConfig = function()
{
	var defer = libQ.defer();
	var self = this;
	
	var lang_code = this.commandRouter.sharedVars.get("language_code");
	
	self.commandRouter.i18nJson(__dirname + "/i18n/strings_" + lang_code + ".json", __dirname + "/i18n/strings_en.json", __dirname + "/UIConfig.json").then(function(uiconf) {
		uiconf.sections[0].content[0].value = self.config.get("username");
		uiconf.sections[0].content[1].value = self.config.get("password");
		uiconf.sections[0].content[2].value = self.config.get("endpoint");
		
		defer.resolve(uiconf);
	}).fail(function() {
		defer.reject(new Error());
	});
	
	return defer.promise;
};


/**
 *	Hook into volumio
 */
ControllerAmpache.prototype.addToBrowseSources = function()
{
	var data = {
		name: "Ampache",
		uri: "ampache",
		plugin_type: "music_service",
		plugin_name: "ampache",
		albumart: "/albumart?sourceicon=music_service/ampache/ampache.png"
	};
	
	this.commandRouter.volumioAddToBrowseSources(data);
};


/**
 *	Interesting router
 */
ControllerAmpache.prototype.handleBrowseUri = function(uri)
{
	this.lastUri = uri;
	
	var self = this;
	var response = undefined;
	
	if(uri.startsWith("ampache") === false)
		return response;
	
	var stack = uri.match(/^(.*?)(?:\?(.*?))?$/);
	var path = stack[1];
	var qs = stack[2] ? querystring.parse(stack[2]) : {};
	
	// if this url is not a regex, go ahead with running it
	if(typeof Router[path] !== "undefined")
		return (new Router[path](this)).run(path, qs);
	
	// bad times! since i lack the willingness to implement something like
	// the router from express in here, i'm just going to create my own router
	// based on expressions in the Router object.
	var keys = Object.keys(Router);
	
	for(var i in keys)
	{
		if(keys[i].substr(0, 1) === "^")
		{
			var result = path.match(new RegExp(keys[i]));
			
			if(result)
			{
				var object = Router[keys[i]];
				var context = new object(this);
				var params = [ path, qs ];
				
				for(var j = 1; j < result.length; ++j)
					params.push(result[j]);
				
				this.logger.info("Ampache handleBrowseUri: " + uri + " -> resolved to: " + keys[i]);
				
				return context.run.apply(context, params);
			}
		}
	}
	
	this.logger.info("Ampache handleBrowseUri: " + uri + " -> not resolved");
	
	return response;
}


/**
 *	Perform a search
 */
ControllerAmpache.prototype.search = function(query)
{
	var defer = libQ.defer();
	
	// what we can do is just delegate this to our handleBrowseUri function and
	// let this do all of the heavy work
	var stack = (query.uri || "").match(/^(.*?)(?:\?(.*?))?$/);
	var path = stack[1];
	var qs = stack[2] ? querystring.parse(stack[2]) : {};
	
	qs.p = 0;
	qs.filter = query.value || "";
	
	var response = this.handleBrowseUri(path + "?" + querystring.stringify(qs));
	
	if(response !== undefined)
	{
		response.then(function(body) {
			var data = body.navigation.lists[0];
			
			data.title = "Ampache result";
			data.icon = "fa fa-music";
			
			defer.resolve(data);
		});
	}
	else
	{
		defer.reject();
	}
	
	return defer.promise;
}


/**
 *	Explode Uri
 */
ControllerAmpache.prototype.explodeUri = function(uri)
{
    var self = this;
    
    return libQ.resolve({
        uri: uri,
        service: "webradio", // change to ampache
        name: uri,
        type: "track"
    });
};


/**
 *	Explode Uri
 */
ControllerAmpache.prototype.getLastUri = function(uri)
{
	return this.lastUri;
};


/**
 *	Playing functions
 */
ControllerAmpache.prototype.clearAddPlayTrack = function(track)
{
    var self = this;
    var safeUri = track.uri.replace(/"/g, '\\"');
    
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerAmpache::clearAddPlayTrack');
    
    return self.mpdPlugin.sendMpdCommand('stop', []).then(function() {
        return self.mpdPlugin.sendMpdCommand('clear', []);
    }).then(function() {
        return self.mpdPlugin.sendMpdCommand('load "' + safeUri + '"', []);
    }).fail(function (e) {
        return self.mpdPlugin.sendMpdCommand('add "' + safeUri + '"', []);
    }).then(function() {
        self.commandRouter.stateMachine.setConsumeUpdateService('mpd');
        return self.mpdPlugin.sendMpdCommand('play', []);
    });
};

ControllerAmpache.prototype.stop = function()
{
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerAmpache::stop');
    return this.mpdPlugin.sendMpdCommand('stop', []);
};

ControllerAmpache.prototype.pause = function()
{
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerAmpache::pause');
    return this.mpdPlugin.sendMpdCommand('pause', []);
};

ControllerAmpache.prototype.resume = function()
{
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerAmpache::resume');
    return this.mpdPlugin.sendMpdCommand('play', []);
};

ControllerAmpache.prototype.seek = function(position)
{
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerAmpache::seek');
    return this.mpdPlugin.seek(position);
};


/**
 *	Export
 */
module.exports = ControllerAmpache;