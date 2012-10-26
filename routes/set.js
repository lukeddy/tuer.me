var tuerBase = require('../model/base'),
config = require('../lib/config'),
crypto = require('crypto'),
Avatar = require('../lib/avatar'),
EventProxy = require('eventproxy').EventProxy;

var index = function(req, res) {
	if (req.session.is_login) {
		var id = req.session.userdata._id;
		tuerBase.findUser(id, function(err, user) {
			if (err) {
				res.redirect('500');
			} else {
				req.session.title = '个人设置';
				req.session.template = 'set';
				req.session.success = req.flash('success');
				req.session.error = req.flash('error');
				user.BigavatarUrl = Avatar.getArtUrl(user._id);
				user.avatarUrl = Avatar.getUrl(user._id);
				res.render('set/set', {
					user: user,
					session: req.session,
					config: config
				});
			}
		});
	} else {
		res.redirect('login');
	}
};

var update = function(req, res) {
	if (req.session.is_login) {
		var nick = req.body.nick,
		uid = req.session.userdata._id,
		profile = req.body.profile,
		about = req.body.about,
		pageurl = req.body.soleurl,
		successmsg = '设置修改成功',
		proxy = new EventProxy(),
		render = function(msg) {
			if (msg == successmsg) req.flash('success', msg);
			else req.flash('error', msg);
			res.redirect('set');
		};

		proxy.assign('msg', render);

		if (nick.trim() === '') {
			proxy.trigger('msg', '昵称不能为空啊');
			return;
		}
		if (profile.length > 30) {
			proxy.trigger('msg', '签名别多过30个字符啦');
			return;
		}
		if (about.length > 600) {
			proxy.trigger('msg', '个人介绍别多过600个字符啦');
			return;
		}
		if (pageurl && (pageurl.length > 10 || (/[^0-9a-z]/g).test(pageurl))) {
			proxy.trigger('msg', '唯一地址最好少于是个字节和不带标点的噢');
			return;
		}

		var updateDB = {
			nick: nick,
			about: about,
			profile: profile === '' ? 'nothing yet': profile
		};

		if (pageurl && pageurl !== '') {
			updateDB['pageurl'] = pageurl;
		}

		tuerBase.updateById(uid, {
			$set: updateDB
		},
		'users', function(err) {
			if (err) {
				proxy.trigger('msg', err);
			} else {
				proxy.trigger('msg', successmsg);
			}
		});

	} else {
		res.redirect('login');
	}
};

var avatar = function(req, res) {
	if (req.session.is_login) {
		var uid = req.session.userdata._id;
		tuerBase.findUser(uid, function(err, user) {
			req.session.title = '设置头像';
			req.session.template = 'setAvatar';
			req.session.success = req.flash('success');
			req.session.error = req.flash('error');
			user.avatarUrl = Avatar.getUrl(user._id);
			user.BigavatarUrl = Avatar.getArtUrl(user._id);
			res.render('set/setAvatar', {
				user: user,
				session: req.session,
				config: config
			});
		});
	} else {
		res.redirect('login');
	}
};

var avatarUpload = function(req, res) {
	if (req.session.is_login) {
		var uid = req.session.userdata._id,
		successmsg = "图片上传成功",
		lastMod = new Date(),
		avatar = req.body.avatar;

		if (avatar.trim() === '') {
			req.flash('error', '不能传空图啊..');
			res.redirect('avatar');
			return;
		}

		tuerBase.updateById(uid, {
			$set: {
				avatar: avatar,
				lastMod: lastMod
			}
		},
		'users', function(err, ret) {
			if (err) {
				req.flash('error', err);
			} else {
				req.flash('success', successmsg);
			}
			res.send('upload passed');
		});
	} else {
		res.redirect('login');
	}
};

var avatarSave = function(req, res) {
	if (req.session.is_login) {
		var uid = req.session.userdata._id,
		successmsg = '修改头像缩略图成功',
		lastMod = new Date(),
		coords = req.body.coordinate;
        
        if(!coords){
            req.flash('error','非法操作,更新失败');
			res.send('save not passed');
            return;
        }

		tuerBase.updateById(uid, {
			$set: {
				coords: coords,
				lastMod: lastMod
			}
		},
		'users', function(err, ret) {
			if (err) {
				req.flash('error', err);
			} else {
				req.flash('success', successmsg);
			}
			res.send('save passed');
		});
	} else {
		res.redirect('login');
	}
};

var pwd = function(req, res) {
	if (req.session.is_login) {
		var uid = req.session.userdata._id;
		tuerBase.findUser(uid, function(err, user) {
			req.session.title = '修改密码';
			req.session.template = 'setPwd';
			req.session.success = req.flash('success');
			req.session.error = req.flash('error');
			user.BigavatarUrl = Avatar.getArtUrl(user._id);
			user.avatarUrl = Avatar.getUrl(user._id);
			res.render('set/setPwd', {
				user: user,
				session: req.session,
				config: config
			});
		});
	} else {
		res.redirect('login');
	}
};

var pwdSave = function(req, res) {
	if (req.session.is_login) {
		var uid = req.session.userdata._id,
		oldpwd = req.body.old_pwd,
		newpwd = req.body.new_pwd,
		confirmpwd = req.body.confirm_pwd,
		successmsg = '修改密码成功',
		proxy = new EventProxy(),
		render = function(msg) {
			if (msg == successmsg) req.flash('success', msg);
			else req.flash('error', msg);
			res.redirect('pwd');
		};

		proxy.assign('msg', render);

		if (newpwd != confirmpwd) {
			proxy.trigger('msg', '两次输入的修改密码不一致');
			return;
		}

		tuerBase.findUser(uid, function(err, user) {
			if (err) {
				proxy.trigger('msg', err);
			} else {
                var md5 = crypto.createHash("md5");
                md5.update(oldpwd);
                oldpwd = md5.digest("hex");
                var md = crypto.createHash("md5");
                md.update(newpwd);
                newpwd = md.digest("hex");
				if (user.pwd !== oldpwd) {
					proxy.trigger('msg', '旧密码不正确');
					return;
				}
				tuerBase.updateById(uid, {
					$set: {
						pwd:newpwd
					}
				},
				'users', function(err, ret) {
					if (err) {
						proxy.trigger('msg', err);
					} else {
						proxy.trigger('msg', successmsg);
					}
				});
			}
		});
	} else {
		res.redirect('login');
	}
};
exports.index = index;
exports.update = update;
exports.avatar = avatar;
exports.avatarSave = avatarSave;
exports.avatarUpload = avatarUpload;
exports.pwd = pwd;
exports.pwdSave = pwdSave;

