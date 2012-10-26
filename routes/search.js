var tuerBase = require('../model/base'),
config = require('../lib/config'),
util = require('../lib/util'),
EventProxy = require('eventproxy').EventProxy;

var index = function(req, res, next) {
	var q = decodeURIComponent(encodeURI(req.query.q)).trim(),
	nothingMsg = [{
		title: '没有找到相关日记'
	}],
	proxy = new EventProxy(),
	render = function(diaryList) {
       req.session.title = '搜索';
	   req.session.template = 'search';
       res.render('search/search',{
            config:config,
            session:req.session,
            result:diaryList
       }); 
	};
	proxy.assign('findDiary', render);
	if (q) {
		var qstr = util.replaceReg(q);
		searchReg = new RegExp('.*' + qstr + '|' + qstr + '.*', 'i');

		tuerBase.findDiaryBy({
			title: searchReg
		},
		'diary', 10, function(err, diaryList) {
			if (err) throw err;
			else {
				if (diaryList.length) {
					proxy.trigger('findDiary', diaryList);
				} else {
					proxy.trigger('findDiary', nothingMsg);
				}
			}
		});
	} else {
		proxy.trigger('findDiary', nothingMsg);
	}
};

exports.index = index;

