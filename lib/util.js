/**
 * some utils for work
 */
//unicode转换为字符
var imagemagick = require('imagemagick'),
fs = require('fs'),
EventProxy = require('eventproxy').EventProxy,
Path = require('path'),
Calendar = require('calendar').Calendar,
cal = new Calendar(),
rootdir = require('../lib/config').rootdir,
pichost = 'http://img.tuer.me/images/',
picsize = [80, 150, 300, 500];

exports.monthHTML = function(year,month,day,classname,head){
  var Html = '<table>',mdc = cal.monthDays(year,month);
  if(head) Html += '<thead>'+head+'</thead>';
  for(var i=0;i<mdc.length;i++){
     var week = mdc[i];
     Html += '<tr>';
     for(var k=0;k<week.length;k++){
        if(week[k] === day) Html += '<td class="'+classname+'">'+week[k]+'</td>';
        else if(week[k] !== 0) Html += '<td>'+week[k]+'</td>';
        else if(week[k] === 0) Html += '<td>&nbsp;</td>';
     }
     Html += '</tr>';
  }
  Html += '</table>';
  return Html;
};

exports.unicode2Chr = function(str) {
	if ('' !== str) {
		var st, t, i;
		st = '';
		for (i = 1; i <= str.length / 4; i++) {
			t = str.slice(4 * i - 4, 4 * i - 2);
			t = str.slice(4 * i - 2, 4 * i).concat(t);
			st = st.concat('%u').concat(t);
		}
		st = unescape(st);
		return (st);
	}
	else return ('');
};
//字符转换为unicode 
exports.chr2Unicode = function(str) {
	if ('' !== str) {
		var st, t, i;
		st = '';
		for (i = 1; i <= str.length; i++) {
			t = str.charCodeAt(i - 1).toString(16);
			if (t.length < 4) {
				while (t.length < 4) {
					t = '0'.concat(t);
				}
			}
			t = t.slice(2, 4).concat(t.slice(0, 2));
			st = st.concat(t);
		}
		return (st.toUpperCase());
	}
	else {
		return ('');
	}
};

exports.replaceReg = function(str) {
	var self = this;
	var qstr = this.chr2Unicode(str);
	var reglist = ['.', '$', '^', '{', '[', '(', '|', ')', '*', '+', '?', '\\', '}', ']'];
	reglist.forEach(function(r, index) {
		reglist[index] = self.chr2Unicode(r);
	});
	var reg = new RegExp(reglist.join('|'), 'g');
	qstr = qstr.replace(reg, function(text) {
		return '5C00' + text;
	});
	return this.unicode2Chr(qstr);
};

exports.mix = function(target, source, covered) {
	var key;
	for (key in source) {
		if (!covered || ! (key in target)) {
			target[key] = source[key];
		}
	}
	return target;
};

exports.paramUrl = function(url) {
	var ret = {},
	data = url.split('&');
	for (var i = 0; i < data.length; i++) {
		var oc = data[i].split('=');
		ret[oc[0]] = oc[1];
	}
	return ret;
};

exports.random36 = function(len) {
	var lists = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
	ret = [],
	total = lists.length;
	for (var i = 0; i < len; i++) {
		ret.push(lists[Math.floor(Math.random() * total)]);
	}
	return ret.join('');
};

exports.ov = function(ar) {
	var m, n = [],
	o = {};
	for (var i = 0;
	(m = ar[i]) !== undefined; i++) {
		if (!o[m]) {
			n.push(m);
			o[m] = true;
		}
	}
	return n.sort(function(a, b) {
		return a - b;
	});
};

exports.isEmptyObject = function(obj) {
	for (var i in obj) return false;
	return true;
};

exports.notHasfiles = function(obj) {
	if (this.isEmptyObject(obj)) return true;
	for (var i in obj) {
		if (obj[i]['size'] === 0) return true;
	}
	return false;
};

exports.getpics = function(size, counts, data) {
	if (this.isEmptyObject(data) || ! data) return false;
	var n = 0,
	ret = [];
	for (var i in data) {
		ret.push(pichost + size + '/' + data[i]);
		n++;
		if (n === counts) break;
	}
	if (ret.length === 1) return ret[0];
	return ret;
};

exports.removePic = function(filelist, callback) {
	for (var i in filelist) {
		var pic = filelist[i];
		picsize.forEach(function(size) {
			try {
				fs.unlinkSync(rootdir +'/public/images/'+ size + '/' + pic);
			} catch(e) {
				if (callback) callback(e);
			}
		});
	}
	if (callback) callback();
};

exports.setNoCache = function(res) {
	res.header('expires', 'Sun, 1 Jan 2006 01:00:00 GMT');
	res.header('cache-control', 'no-cache,must-revalidate,private,no-store');
	res.header('pragma', 'no-cache');
};

exports.setTime = function(data) {
	var D = new Date(data['created_at']);
    var hour = D.getHours();
    var since;
    if(hour >= 12 && hour < 18) since = '下午';
    if(hour >= 18 && hour < 20) since = '傍晚';
    if(hour >= 20 && hour < 24) since = '夜晚';
    if(hour >= 0 && hour < 6) since = '凌晨';
    if(hour >= 6 && hour < 9) since = '早晨';
    if(hour >= 9 && hour < 12) since = '上午';
	data['created_at'] = D.getFullYear() + '-' + (D.getMonth() + 1) + '-' + D.getDate() + ' ' + since;
};

exports.setDay = function(data) {
	var D = new Date(data['created_at']);
	data['created_at'] = D.getFullYear() + '-' + (D.getMonth() + 1) + '-' + D.getDate();
};

exports.remove_temp = function(proxy, trigger, temp_path) {
	fs.unlink(temp_path, function(err) {
		if (err) {
			throw err;
		} else {
			proxy.trigger(trigger);
		}
	});
};

exports.bacthImages = function(path, callback) {
	var proxy = new EventProxy(),
	finish = function() {
		callback(null);
	};

	var queue = [80, 150, 300, 500, 'unlink'],
	picname = Path.basename(path),
	index = 0;

	proxy.assign(80, 150, 300, 500, 'unlink', finish);

	var resizesize = function(i) {
		ret = {
			srcPath: path,
			dstPath: rootdir + '/public/images/' + queue[i] + '/' + picname,
			width: queue[i],
			height: queue[i],
			timeout: 1000 * 15
		};
		return ret;
	};

	function resizehandle(err) {
		if (err) {
			try {
				fs.unlinkSync(path);
				fs.unlinkSync(rootdir + '/public/images/50/' + picname);
				fs.unlinkSync(rootdir + '/public/images/150/' + picname);
				fs.unlinkSync(rootdir + '/public/images/300/' + picname);
				fs.unlinkSync(rootdir + '/public/images/500/' + picname);
			} catch(e) {
                console.log(e);
            }
			callback(err);
		} else {
			proxy.trigger(queue[index]);
			index++;
			if (queue[index] == 'unlink') {
				fs.unlink(path, function(err) {
					if (err) callback(err);
					else proxy.trigger('unlink');
				});
			} else {
				imagemagick.resize(resizesize(index), resizehandle);
			}
		}
	}
	imagemagick.resize(resizesize(index), resizehandle);
};

