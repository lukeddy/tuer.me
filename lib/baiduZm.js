var config = require('./config.js'),
xml2js = require('xml2js'),
http = require('http');

var baiduZm = function() {
	this.root = "box.zhangmen.baidu.com";
};

baiduZm.prototype = {
	constructor: baiduZm,
	get: function(uri, callback) {
		var req = http.request({
			host: this.root,
			port: 80,
			path: uri,
			method: "GET"
		},
		function(res) {
			var ret = '';
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				ret += chunk;
			});
			res.on('end', function() {
				callback(null, ret);
			});
		});

		req.on('error', function(err) {
			callback(err);
		});

		req.end();
	},
	getUri: function(param) {
		return '/x?op=12&count=1&title=' + encodeURIComponent(param.title) + '$$' + encodeURIComponent(param.author) + '$$$$';
	},
	searchTrack: function(param, callback) {
		var uri = this.getUri(param);
		this.get(uri, function(err, xml) {
			if (err) callback(err);
			else {
				var parser = new xml2js.Parser();
				parser.parseString(xml, function(err, result) {
					if (err) callback(err);
					else {
                        if(!result['result']['p2p']){
                            callback(null,{
                                ret:false
                            });
                            return; 
                        }
                        var url = result['result']['p2p'][0]['url'][0],
                        type = result['result']['p2p'][0]['type'][0];
						if(url){
                            callback(null,{
                                url:url,
                                type:type,
                                ret:true
                            }); 
                        }else{
                            callback(null,{
                                ret:false
                            });
                        }
					}
				});
			}

		});
	}
};

exports.baiduZm = baiduZm;
