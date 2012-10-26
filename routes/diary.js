var tuerBase = require('../model/base'),
fs = require('fs'),
path = require('path'),
rootdir = require('../lib/config').rootdir,
util = require('../lib/util'),
Avatar = require('../lib/avatar'),
pag = require('../lib/pag').pag,
config = require('../lib/config'),
escape = require('jade').runtime.escape,
EventProxy = require('eventproxy').EventProxy;

var detail = function(req, res, next) {
	var id = req.params.id,
	space = 100,
	page = isNaN(req.query.page) ? 0: req.query.page - 1,
	proxy = new EventProxy(),
	render = function(user, isSelf, diary, comments) {

		if (req.session.is_login) tuerBase.removeDiaryTips(req.session.userdata._id, diary._id);

		if (diary.privacy == 1 && user._id.toString() != req.session.userdata._id.toString()) {
			res.redirect('404');
			return;
		}

		util.setTime(diary);
		diary.img = util.getpics(150, 1, diary.filelist);
		diary.bigimg = util.getpics(500, 1, diary.filelist);
		diary.content = escape(diary.content).replace(/\r\n/g, '<br>');

		user.avatarUrl = Avatar.getUrl(user._id);

		comments.forEach(function(item) {
			util.setTime(item);
			item.avatarUrl = Avatar.getUrl(item.userid);
			item.content = escape(item.content).replace(/\r\n/g, '<br>');
			if (req.session.is_login && item.userid !== req.session.userdata._id.toString()) item.reply = true;
			if (req.session.is_login && (diary.userid == req.session.userdata._id.toString() || item.userid == req.session.userdata._id.toString())) item.del = true;
		});

		req.session.title = user.nick + '的日记 ' + '<<' + (diary.title || diary.bookname) + '>>';
		req.session.error = req.flash('error');
		req.session.template = 'diarydetail';
		res.render('diary/diarydetail', {
			config: config,
			session: req.session,
			user: user,
			isSelf: isSelf,
			diary: diary,
			pag: new pag({
				cur: page + 1,
				space: space,
				total: diary.commentcount,
				split: '=',
				url: '/diary/' + diary._id + '?page'
			}).init(),
			comments: comments
		});

	};

	proxy.assign('user', 'isSelf', 'diary', 'comments', render);

	if (!id) {
		res.redirect('404');
	} else {
		tuerBase.findDiaryById(id, function(err, diary) {
			if (err || ! diary) {
				next();
			} else {
				proxy.trigger('diary', diary);

				var uid = diary.userid;

				tuerBase.findUser(uid, function(err, user) {
					if (err) {
						res.redirect('500');
					} else {
						proxy.trigger('user', user);
						var isSelf = req.session.is_login ? req.session.userdata._id.toString() == user._id: false;
						proxy.trigger('isSelf', isSelf);
					}
				});

				tuerBase.findCommentSlice(id, page * space, page * space + space, function(err, comments) {
					if (err) {
						res.redirect('500');
					} else {
						proxy.trigger('comments', comments);
					}
				});
			}
		});
	}
};

var list = function(req, res) {
	var page = req.params.page,
	space = 15,
	proxy = new EventProxy();
	if (page && isNaN(page)) {
		res.redirect('404');
		return;
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}

	var split = page * space,
	render = function(Diaries, DiarysCount) {

		req.session.template = 'diaries';
		req.session.title = '全部日记';

		Diaries.forEach(function(item) {
			util.setTime(item);
			item.img = util.getpics(150, 1, item.filelist);
			item.avatarUrl = Avatar.getUrl(item.userid);
			item.content = item.content.length > 50 ? item.content.slice(0, 50) + '...': item.content;
		});

		res.render('diary/diaries', {
			config: config,
			session: req.session,
			diaries: Diaries,
			pag: new pag({
				cur: page + 1,
				space: space,
				total: DiarysCount,
				url: '/diaries'
			}).init()
		});
	};

	proxy.assign('Diaries', 'DiarysCount', render);

	tuerBase.findDiarySlice(split, split + space, function(err, lists) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('Diaries', lists);
		}
	});

	tuerBase.getCount({
		privacy: 0
	},
	'diary', function(err, count) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('DiarysCount', count);
		}
	});
};

var followedDiaries = function(req, res) {

	if (!req.session.is_login) {
		res.redirect('login');
		return;
	}

	var page = req.params.page,
	space = 15,
	proxy = new EventProxy();
	if (page && isNaN(page)) {
		res.redirect('404');
		return;
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}

	var split = page * space,
	render = function(Diaries, DiarysCount) {

		req.session.template = 'followedDiaries';
		req.session.title = req.session.userdata.nick + '关注的日记';

		Diaries.forEach(function(item) {
			util.setTime(item);
			item.img = util.getpics(150, 1, item.filelist);
			item.avatarUrl = Avatar.getUrl(item.userid);
			item.content = item.content.length > 50 ? item.content.slice(0, 50) + '...': item.content;
		});

		res.render('diary/diaries', {
			config: config,
			session: req.session,
			diaries: Diaries,
			pag: new pag({
				cur: page + 1,
				space: space,
				total: DiarysCount,
				url: '/followed/diaries'
			}).init()
		});
	};

	proxy.assign('Diaries', 'DiarysCount', render);

	tuerBase.findById(req.session.userdata._id.toString(), 'users', function(err, user) {
		if (err) {
			res.redirect('500');
		} else {
			tuerBase.findDiaryByUsers(user.firends, false, split, split + space, function(err, lists) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('Diaries', lists);
				}
			});

			tuerBase.getCount({
				privacy: 0,
				userid: {
					'$in': user.firends
				}
			},
			'diary', function(err, count) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('DiarysCount', count);
				}
			});
		}
	});
};

var write = function(req, res) {

	if (!req.session.is_login) {
		res.redirect('login');
		return;
	}

	var uid = req.session.userdata._id,
	proxy = new EventProxy(),
	render = function(user, books) {

		req.session.title = '写日记';
		req.session.template = 'write';
		req.session.error = req.flash('error');

		res.render('diary/write', {
			config: config,
			session: req.session,
			action: '/diary/save',
			user: user,
			books: books,
            mood:config.mood,
            weather:config.weather,
			diary: {}
		});
	};

	proxy.assign('user', 'books',render);
	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('user', user);
			tuerBase.findBy({
				owner: {
					'$in': [uid.toString(), - 1]
				}
			},
			'notebooks', user.notebook + 1, function(err, books) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('books', books);
				}
			});
		}
	});
};

var save = function(req, res) {
	if (!req.session.is_login) {
		res.redirect('login');
		return;
	}
	var bookid = req.body.bookid,
	content = req.body.content,
    location = req.body.location,
    weather = req.body.weather,
    mood = req.body.mood,
	privacy = req.body.privacy || 0,
	forbid = req.body.forbid || 0,
	uploadPic = req.files.uploadPic,
	temp_path = uploadPic.path,
	type = function() {
		var _type;
		try {
			_type = '.' + uploadPic.type.split('/')[1];
		} catch(e) {
			return ".undef";
		}
		return _type;
	} (),
	filename = path.basename(temp_path),
	picname = filename + type,
	target_path = rootdir + '/public/images/' + picname,
	proxy = new EventProxy(),
	saveNote = function(removeTemp, pic_path) {
		var filelist = {};
		if (pic_path) filelist['pic_path'] = picname;
        var savedata = {
			content: content,
			notebook: bookid,
			userid: req.session.userdata._id,
			filelist: filelist,
            mood:mood,
            weather:weather,
			privacy: privacy,
			forbid: forbid,
			commentcount: 0
        };
        if(weather) savedata['weather'] = weather;
        if(mood) savedata['mood'] = mood;
        if(location) savedata['location'] = location;
		tuerBase.save(savedata, 'diary', function(err, data) {
			if (err) {
				req.flash('error', err);
				res.redirect('back');
			} else {
				res.redirect('home');
			}
		});
	};
	proxy.assign('removeTemp', 'pic_path', saveNote);

	//增加校验
	if ((!bookid || ! content) || ((privacy !== 0 && privacy != 1) || (forbid !== 0 && forbid != 1))) {
		req.flash('error', '非法操作');
		util.remove_temp(proxy, 'removeTemp', temp_path);
		res.redirect('back');
		return;
	}

    if(location.trim().length > 10){
		req.flash('error', '地点最多10个字');
		util.remove_temp(proxy, 'removeTemp', temp_path);
		res.redirect('back');
		return;
    }

	if (content.trim().length > 2200) {
		req.flash('error', '日记字数最多2200字');
		util.remove_temp(proxy, 'removeTemp', temp_path);
		res.redirect('back');
		return;
	}

	if (uploadPic.size) {
		if (!type.match(/jpg|png|jpeg|gif/gi)) {
			req.flash('error', '只能上传图片文件');
			res.redirect('back');
			util.remove_temp(proxy, 'removeTemp', temp_path);
			return;
		}
		if (uploadPic.size > 20971520) {
			req.flash('error', '图片大小不能超过2MB');
			res.redirect('back');
			util.remove_temp(proxy, 'removeTemp', temp_path);
			return;
		}
		fs.rename(temp_path, target_path, function(err) {
			if (err) {
				req.flash('error', err);
				res.redirect('back');
			} else {
				proxy.trigger('removeTemp');
				util.bacthImages(target_path, function(err) {
					if (err) {
						req.flash('error', err);
						res.redirect('back');
					} else {
						proxy.trigger('pic_path', true);
					}
				});
			}
		});
	} else {
		util.remove_temp(proxy, 'removeTemp', temp_path);
		proxy.trigger('pic_path', false);
	}
};

var edit = function(req, res) {

	if (!req.session.is_login) {
		res.redirect('login');
		return;
	}

	var id = req.params.id,
	uid = req.session.userdata._id,
	proxy = new EventProxy(),
	render = function(user, books, diary) {
		if (user._id.toString() !== uid.toString()) {
			res.redirect('404');
			return;
		}

		req.session.title = '编辑日记';
		req.session.template = 'write';
		req.session.error = req.flash('error');

		diary.img = util.getpics(80, 1, diary.filelist);

		res.render('diary/write', {
			config: config,
			session: req.session,
			action: '/diary/update',
			user: user,
			books: books,
            mood:config.mood,
            weather:config.weather,
			diary: diary
		});
	};

	proxy.assign('user', 'books', 'diary', render);

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('user', user);
			tuerBase.findBy({
				owner: {
					'$in': [uid.toString(), - 1]
				}
			},
			'notebooks', user.notebook + 1, function(err, books) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('books', books);
				}
			});
			tuerBase.findDiaryById(id, function(err, diary) {
				if (err) {
					res.redirect('500');
				} else if (!diary) {
					res.redirect('404');
				} else {
					proxy.trigger('diary', diary);
				}
			});
		}
	});

};

var update = function(req, res) {

	if (!req.session.is_login) {
		res.redirect('login');
		return;
	}

	var proxy = new EventProxy(),
	picname,
	bookid = req.body.bookid,
    location = req.body.location,
	content = req.body.content,
    mood = req.body.mood,
    weather = req.body.weather,
	diaryid = req.body.id,
	privacy = req.body.privacy || 0,
	forbid = req.body.forbid || 0,
	updateNote = function(removeTemp, pic_path, diary) {

		if (req.session.userdata._id.toString() != diary.userid) {
			res.redirect('404');
			return;
		}

		var files = pic_path ? {
			'pic_path': picname
		}: diary.filelist;

        var updatedata = {
				content: content,
				filelist: files,
				forbid: forbid,
				privacy: privacy,
				notebook: bookid
        };
        if(weather) updatedata['weather'] = weather;
        if(mood) updatedata['mood'] = mood;
        if(location) updatedata['location'] = location;

		tuerBase.updateById(diaryid, {
			$set: updatedata
		},
		'diary', function(err) {
			if (err) {
				res.redirect('500');
			} else {
				res.redirect('home');
				if (pic_path) {
					//删除编辑之前的图片
					util.removePic(diary.filelist, function(err) {
						if (err) throw err;
					});
				}
			}
		});
	};
	proxy.assign('removeTemp', 'pic_path', 'diary', updateNote);

	if ((!bookid || ! content) || ((privacy !== 0 && privacy != 1) || (forbid !== 0 && forbid != 1))) {
		req.flash('error', '非法操作');
		util.remove_temp(proxy, 'removeTemp', temp_path);
		res.redirect('back');
		return;
	}

	if (location.trim().length > 10) {
		req.flash('error', '地点最多10个字');
		util.remove_temp(proxy, 'removeTemp', temp_path);
		res.redirect('back');
		return;
	}

	if (content.trim().length > 2200) {
		req.flash('error', '日记字数最多2200字');
		util.remove_temp(proxy, 'removeTemp', temp_path);
		res.redirect('back');
		return;
	}

	if (req.files.hasOwnProperty('uploadPic')) {
		var uploadPic = req.files.uploadPic,
		temp_path = uploadPic.path,
		type = function() {
			var _type;
			try {
				_type = '.' + uploadPic.type.split('/')[1];
			} catch(e) {
				return ".undef";
			}
			return _type;
		} (),
		filename = path.basename(temp_path);
		picname = filename + type;
		var target_path = rootdir + '/public/images/' + picname;
		if (uploadPic.size) {
			if (!type.match(/jpg|png|jpeg|gif/gi)) {
				req.flash('error', '只能上传图片文件');
				res.redirect('back');
				util.remove_temp(proxy, 'removeTemp', temp_path);
				return;
			}
			if (uploadPic.size > 20971520) {
				req.flash('error', '图片大小不能超过2MB');
				res.redirect('back');
				util.remove_temp(proxy, 'removeTemp', temp_path);
				return;
			}
			fs.rename(temp_path, target_path, function(err) {
				if (err) {
					req.flash('error', err);
					res.redirect('back');
				} else {
					proxy.trigger('removeTemp');
					util.bacthImages(target_path, function(err) {
						if (err) {
							req.flash('error', err);
							res.redirect('back');
						} else {
							proxy.trigger('pic_path', true);
						}
					});
				}
			});
		} else {
			util.remove_temp(proxy, 'removeTemp', temp_path);
			proxy.trigger('pic_path', false);
		}
	} else {
		proxy.trigger('pic_path', false);
		proxy.trigger('removeTemp');
	}

	tuerBase.findById(diaryid, 'diary', function(err, diary) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('diary', diary);
		}
	});
};

var remove = function(req, res) {
	var id = req.body.id,
	proxy = new EventProxy();
	if (!req.session.is_login) {
		res.redirect('login');
		return;
	}

	var render = function() {
		res.redirect('home');
	};

	proxy.assign('rmdiary', 'rmcomments', 'rmpics', render);

	tuerBase.findById(id, 'diary', function(err, diary) {
		if (err) {
			res.redirect('500');
		} else if (diary.userid == req.session.userdata._id.toString()) {
			var filelist = diary['filelist'] || {};
			tuerBase.removeById(id, 'diary', function(err, ret) {
				if (err) throw err;
				else proxy.trigger('rmdiary');
			});
			util.removePic(filelist, function(err) {
				if (err) throw err;
				else proxy.trigger('rmpics');
			});
			tuerBase.removeBy({
				related_id: id
			},
			'comment', function(err, ret) {
				if (err) throw err;
				else proxy.trigger('rmcomments');
			});
		} else {
			res.redirect('404');
		}
	});
};

exports.detail = detail;
exports.list = list;
exports.write = write;
exports.save = save;
exports.edit = edit;
exports.update = update;
exports.remove = remove;
exports.followedDiaries = followedDiaries;

