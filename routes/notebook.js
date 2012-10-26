var tuerBase = require('../model/base'),
config = require('../lib/config'),
EventProxy = require('eventproxy').EventProxy;

var index = function(req, res) {
	if (!req.session.is_login) {
		res.redirect('login');
		return;
	}

	var uid = req.session.userdata._id,
	proxy = new EventProxy(),
	render = function(user, notebooks) {

		req.session.title = '管理日记本';
		req.session.template = 'notebook';
		req.session.success = req.flash('success');
		req.session.error = req.flash('error');

		res.render('notebook/notebook', {
			user: user,
			config: config,
			session: req.session,
			notebooks: notebooks
		});
	};

	proxy.assign('user', 'notebooks', render);

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('user', user);
			tuerBase.findBy({
				owner: uid.toString()
			},
			'notebooks', user.notebook, function(err, notebooks) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('notebooks', notebooks);
				}
			});
		}
	});

};

var save = function(req, res) {
	var name = req.body.bookname,
	owner = req.session.userdata._id,
	bgcolor = req.body.bgcolor,
	proxy = new EventProxy(),
	render = function() {
		req.flash('success', '保存成功');
		res.redirect('notebook');
	};

	proxy.assign('updateUser', 'saveBook', render);
	//增加限制个数的检测
	tuerBase.save({
		owner: owner,
		name: name,
		bgcolor: bgcolor
	},
	'notebooks', function(err, books) {
		if (err) {
			req.flash('error', err);
			res.redirect('back');
		} else {
			proxy.trigger('saveBook');
			tuerBase.updateById(owner, {
				'$inc': {
					notebook: 1
				}
			},
			'users', function(err) {
				if (err) {
					req.flash('error', err);
					res.redirect('back');
				} else {
					proxy.trigger('updateUser');
				}
			});
		}
	});
};

var update = function(req, res) {
	var bookid = req.body.bookid,
	bgcolor = req.body.bgcolor,
	bookname = req.body.bookname;

	tuerBase.updateById(bookid, {
		'$set': {
			name: bookname,
			bgcolor: bgcolor
		}
	},
	'notebooks', function(err, book) {
		if (err) {
			req.flash('error', err);
			res.redirect('back');
		} else {
			req.flash('success', '修改成功');
			res.redirect('notebook');
		}
	});
};

var remove = function(req, res) {
	var bookid = req.body.bookid,
	uid = req.session.userdata._id,
	proxy = new EventProxy(),
	render = function() {
		req.flash('success', '删除成功');
		res.redirect('back');
	};
	proxy.assign('rmbook', 'rmbooklen', 'mvDefault', render);

	tuerBase.removeById(bookid, 'notebooks', function(err, num) {
		if (err) {
			req.flash('error', err);
			res.redirect('back');
		} else {
			proxy.trigger('rmbook');
		}
	});

	tuerBase.getCount({
		notebook: bookid
	},
	'diary', function(err, len) {
		tuerBase.findBy({
			userid: uid.toString(),
			notebook: bookid
		},
		'diary', len, function(err, diaries) {
			if (err) {
				req.flash('error', err);
				res.redirect('back');
			} else {
				var ids = function() {
					var ret = [];
					diaries.forEach(function(item) {
						ret.push(item._id);
					});
					return ret;
				} ();
				tuerBase.findBy({
					owner: - 1
				},
				'notebooks', 1, function(err, notebooks) {
					if (err && ! notebooks.length) {
						req.flash('error', err);
						res.redirect('back');
					} else {
						var defaultBookId = notebooks[0]._id.toString();
						tuerBase.update({
							_id: {
								'$in': ids
							}
						},
						{
							$set: {
								notebook: defaultBookId
							}
						},
						'diary', function(err, ret) {
							if (err) {
								req.flash('error', err);
								res.redirect('back');
							} else {
								proxy.trigger('mvDefault');
							}
						});

					}
				});
			}
		});
	});

	tuerBase.updateById(uid, {
		'$inc': {
			notebook: - 1
		}
	},
	'users', function(err, user) {
		if (err) {
			req.flash('error', err);
			res.redirect('back');
		} else {
			proxy.trigger('rmbooklen');
		}
	});
};

exports.index = index;
exports.save = save;
exports.update = update;
exports.remove = remove;

