var config = require('../../lib/config'),
tuerBase = require('../../model/base'),
util = require('../../lib/util'),
Avatar = require('../../lib/avatar'),
pag = require('../../lib/pag').pag,
escape = require('jade').runtime.escape,
EventProxy = require('eventproxy').EventProxy;

exports.detail = function(req,res,next) {
	var id = req.params.id,
    space = 100,
    page = isNaN(req.query.page) ? 0 : req.query.page - 1,
	proxy = new EventProxy(),
	render = function(user, isSelf, diary, comments) {

		if (req.session.is_login) tuerBase.removeDiaryTips(req.session.userdata._id, diary._id);

        if(diary.privacy == 1 && user._id.toString() != req.session.userdata._id.toString()){
            res.redirect('404');
            return;
        }

		util.setTime(diary);
		diary.img = util.getpics(80, 1, diary.filelist);
		diary.content = diary.content;

		user.avatarUrl = Avatar.getUrl(user._id);

		comments.forEach(function(item) {
		    item.content = item.content;
            if(req.session.is_login && (diary.userid == req.session.userdata._id.toString() || item.userid == req.session.userdata._id.toString())) item.del = true;
		});

        req.session.error = req.flash('error');

		res.render('wap/diary/detail', {
            session:req.session,
            title:user.nick+'的日记 '+'<<'+(diary.title || diary.bookname)+'>>',
			user: user,
			isSelf: isSelf,
			diary: diary,
			pag: new pag({
				cur: page + 1,
				space: space,
				total: diary.commentcount,
                split:'=',
				url: '/diary/'+diary._id+'?page'
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
						var isSelf = req.session.is_login ? req.session.userdata._id.toString() == user._id.toString(): false;
						proxy.trigger('isSelf', isSelf);
					}
				});

				tuerBase.findCommentSlice(id,page * space , page * space + space, function(err, comments) {
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

exports.list = function(req,res) {
	var page = req.params.page,
	space = 8,
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

		Diaries.forEach(function(item) {
			item.img = util.getpics(80, 1, item.filelist);
			item.content = item.content.length > 50 ? item.content.slice(0,50) + '...' : item.content;
		});

		res.render('wap/diary/diaries', {
            title:'全部日记',
            session:req.session,
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
exports.write = function(req,res) {
	if (!req.session.is_login) {
		res.redirect('/');
		return;
	}
	var uid = req.session.userdata._id,
	proxy = new EventProxy(),
	render = function(user, books) {

        req.session.error = req.flash('error');

		res.render('wap/diary/write', {
			title: '写日记',
            session:req.session,
			action: '/diary/save',
			user: user,
			books: books,
			diary: {}
		});
	};

	proxy.assign('user', 'books', render);
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
exports.edit = function(req,res) {

	if (!req.session.is_login) {
		res.redirect('/');
		return;
	}

	var id = req.params.id,
	uid = req.session.userdata._id,
	proxy = new EventProxy(),
	render = function(user, books, diary) {

		if (user._id.toString() != req.session.userdata._id.toString()) {
			res.redirect('404');
			return;
		}

		diary.img = util.getpics(80, 1, diary.filelist);

		res.render('wap/diary/write', {
			title: '编辑日记',
            session:req.session,
			action: '/diary/update',
			user: user,
			books: books,
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
exports.save = function(req,res) {
	if (!req.session.is_login) {
		res.redirect('/');
		return;
	}
	//增加校验
	var bookid = req.body.bookid,
	content = req.body.content,
	privacy = req.body.privacy || 0,
	forbid = req.body.forbid || 0;
	//增加校验
	if ((!bookid || ! content) || ((privacy !== 0 && privacy != 1) || (forbid !== 0 && privacy != 1))) {
		req.flash('error', '非法操作');
		res.redirect('back');
		return;
	}

	if (content.trim().length > 2200) {
		req.flash('error', '日记字数最多2200字');
		res.redirect('back');
		return;
	}
	var saveNote = function() {
		tuerBase.save({
			content: content,
			notebook: bookid,
			userid: req.session.userdata._id,
			filelist: {},
			privacy: privacy,
			forbid: forbid,
			commentcount: 0
		},
		'diary', function(err, data) {
			if (err) {
                req.flash('error',err);
                res.redirect('back');
			} else {
				res.redirect('/');
			}
		});
	}();
};
exports.update = function(req,res) {

	if (!req.session.is_login) {
		res.redirect('/');
		return;
	}

	var proxy = new EventProxy(),
	bookid = req.body.bookid,
	content = req.body.content,
	diaryid = req.body.id,
	privacy = req.body.privacy || 0,
	forbid = req.body.forbid || 0;

	//增加校验
	if ((!bookid || ! content) || ((privacy !== 0 && privacy != 1) || (forbid !== 0 && privacy != 1))) {
		req.flash('error', '非法操作');
		res.redirect('back');
		return;
	}

	if (content.trim().length > 2200) {
		req.flash('error', '日记字数最多2200字');
		res.redirect('back');
		return;
	}

	var updateNote = function(diary) {

		if (req.session.userdata._id.toString() != diary.userid) {
			res.redirect('404');
			return;
		}

		tuerBase.updateById(diaryid, {
			$set: {
				content: content,
				forbid: forbid,
				privacy: privacy,
				notebook: bookid
			}
		},
		'diary', function(err) {
			if (err) {
				res.redirect('500');
			} else {
				res.redirect('/');
			}
		});
	};
	proxy.assign('diary', updateNote);
	tuerBase.findById(diaryid, 'diary', function(err, diary) {
		if (err) {
            res.redirect('500');
		} else {
			proxy.trigger('diary', diary);
		}
	});

};
exports.remove = function(req,res) {
	var id = req.body.id,
	proxy = new EventProxy();
	if (!req.session.is_login) {
		res.redirect('/');
		return;
	}

	var render = function() {
		res.redirect('/');
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

