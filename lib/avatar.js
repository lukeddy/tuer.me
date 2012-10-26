/**
 * 处理头像数据
 */

var tuerBase = require('../model/base'),
Canvas = require('canvas'),
Image = Canvas.Image;

exports.getAvatar = function(uid, width, height, callback) {
	tuerBase.findUser(uid, function(err, user) {
		if (err) callback(err);
		else {
			var avatar = user.avatar,
			img = new Image;
			img.onload = function() {
                var canvas,ctx;
				if (user.coords && width && height) {
                    canvas = new Canvas(width,height);
                    ctx = canvas.getContext('2d');
                    var coords = user.coords.split(',');
					ctx.drawImage(img, coords[2],coords[3] ,coords[0], coords[1], 0, 0,width,height);
				} else {
					var w = width ? (img.width < width ? img.width: width) : img.width,
					h = height ? (img.height < height ? img.height: height) : img.height;
					canvas = new Canvas(w, h);
					ctx = canvas.getContext('2d');
					ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
				}
				canvas.toBuffer(function(err, buf) {
					if (err) callback(err);
					else{
                        if(user.lastMod) callback(null, buf,user.lastMod);
                        else callback(null, buf,user.created_at);
                    }
				});
			};
			img.onerror = function(err) {
                console.log(err);
				callback(err);
			};
			img.src = avatar;
		}
	});
};

exports.getUrl = function(uid) {
	return 'http://www.tuer.me/user/avatar/' + uid;
};

exports.getArtUrl = function(uid) {
	return 'http://www.tuer.me/user/art/' + uid;
};

