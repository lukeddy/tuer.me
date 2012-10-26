var config = require('../../lib/config'),
util = require('../../lib/util'),
Pag = require('../../lib/pag').pag,
tuerBase = require('../../model/base'),
EventProxy = require('eventproxy').EventProxy;

exports.profile = function(req, res) {
	var proxy = new EventProxy(),
	render = function(user, isSelf, diaryCount, userDiaryList, dtips,ftips) {

		var tips = ftips.concat(dtips);
        
        tips.forEach(function(item){
            if(item.content) item.content = item.content.length > 10 ? item.content.slice(0,10) + '...' : item.content;
        });

		userDiaryList.forEach(function(item) {
			item.img = util.getpics(80, 1, item.filelist);
			item.content = item.content.length > 50 ? item.content.slice(0, 50) + '...': item.content;
		});
		res.render('wap/user/profile', {
			session: req.session,
			title: user.nick + '的个人主页',
			isSelf: isSelf,
            tips:tips,
			user: user,
			diaryCount: diaryCount,
			diaries: userDiaryList,
			pag: new Pag({
				cur: 1,
				space: 6,
				url: '/profile/' + user._id + '/diaries',
				total: diaryCount
			}).init()
		});
		if (!isSelf && req.session.is_login) tuerBase.removeFriendsTips(req.session.userdata._id, user._id);
	};

	proxy.assign('User', 'isSelf', 'DiaryCount', 'UserDiaryList', 'diaryTips', 'frinedsTips', render);

	var uid = req.params.id;

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('User', user);

			var uid = user._id.toString(),
			isSelf = req.session.is_login ? (req.session.userdata._id.toString() == uid) : false;

			proxy.trigger('isSelf', isSelf);

			tuerBase.findDiaryCount(uid, isSelf, function(err, DiaryCount) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('DiaryCount', DiaryCount);
				}
			});

			tuerBase.findDiaryByUserId(uid, isSelf, 0, 6, function(err, lists) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('UserDiaryList', lists);
				}
			});

			if (isSelf) {
				var id = req.session.userdata._id.toString();

				tuerBase.findFriendsByUserId(id, function(err, tips) {
					if (err) {
						res.redirect('500');
					} else {
						proxy.trigger('frinedsTips', tips);
					}
				});

				tuerBase.findDiaryTipsByUserId(id, function(err, tips) {
					if (err) {
						res.redirect('500');
					} else {
						proxy.trigger('diaryTips', tips);
					}
				});
			} else {
				proxy.trigger('frinedsTips', []);
				proxy.trigger('diaryTips', []);
			}
		}
	});
};

exports.diaries = function(req, res, next) {
	var page = req.params.page,
	space = 6,
	uid = req.params.uid;
	if (page && isNaN(page)) {
		res.redirect('404');
		return;
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}

	var proxy = new EventProxy(),
	render = function(user, isSelf, diaryCount, userDiaryList) {

		userDiaryList.forEach(function(item) {
			item.img = util.getpics(80, 1, item.filelist);
			item.content = item.content.length > 50 ? item.content.slice(0, 50) + '...': item.content;
		});

		res.render('wap/user/diarylist', {
			session: req.session,
            title:user.nick + '的日记列表页',
			isSelf: isSelf,
			user: user,
			diaryCount: diaryCount,
			diaries: userDiaryList,
			pag: new Pag({
				cur: page + 1,
				space: space,
				total: diaryCount,
				url: '/profile/' + uid + '/diaries'
			}).init()
		});
	};

	proxy.assign('user', 'isSelf', 'diaryCount', 'UserDiaryList', render);

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {

			proxy.trigger('user', user);

			var uid = user._id,
			isSelf = req.session.is_login ? (req.session.userdata._id == uid) : false;

			proxy.trigger('isSelf', isSelf);

			tuerBase.findDiaryCount(uid, isSelf, function(err, count) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('diaryCount', count);
				}
			});

			var split = page * space;

			tuerBase.findDiaryByUserId(uid, isSelf, split, split + space, function(err, lists) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('UserDiaryList', lists);
				}
			});

		}
	});

};


