var config = require('../lib/config'),
tuerBase = require('../model/base'),
util = require('../lib/util'),
crypto = require('crypto'),
EventProxy = require('eventproxy').EventProxy,
mail = require('../lib/mail.js');

var index = function(req, res) {
	req.session.title = '忘记密码';
	req.session.template = 'forgot';
	res.render('login/forgot', {
		config: config,
		session: req.session
	});
};

var findpwd = function(req, res) {

	var proxy = new EventProxy(),
	email = req.body.email,
	render = function(msg) {
		req.session.title = '找回密码';
		req.session.template = 'invite';
		res.render('login/invite', {
			config: config,
			session: req.session,
			message: msg
		});
	};
	proxy.assign('render', render);

	var md5 = crypto.createHash("md5"),
	newpassword = util.random36(10);
	md5.update(newpassword);
	var pwd = md5.digest("hex");

	tuerBase.findOne({
		accounts: email
	},
	'users', function(err, user) {
		if (err) {
			proxy.trigger('render', err);
		} else if (user) {
			tuerBase.update({
				accounts: email
			},
			{
			    $set:{
                    pwd: pwd
                }
			},
			'users', function(err, ret) {
				if (err) {
					proxy.trigger('render', err);
				} else {
					mail.send_mail({
						to: email,
						subject: '您在兔耳的密码！',
						html: '<p>这是您的新密码 ' + newpassword + ',我们一直在等候着您!</p>'
					},
					function(err) {
						if (err) {
							proxy.trigger('render', err);
						} else {
							proxy.trigger('render', '已经发了邮件到您注册的邮箱里了，请及时查收。');
						}
					});
				}
			});
		} else {
			proxy.trigger('render', '未注册过的邮箱');
		}
	});
};

exports.index = index;
exports.findpwd = findpwd;

