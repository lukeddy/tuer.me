var tuerBase = require('../model/base'),
config = require('../lib/config'),
base64 = require('../lib/base64'),
crypto = require('crypto'),
util = require('../lib/util'),
mail = require('../lib/mail'),
EventProxy = require('eventproxy').EventProxy;

var index = function(req, res) {
	if (req.session.is_login) {
		res.redirect('home');
	} else {
		req.session.title = '注册兔耳';
		req.session.template = 'register';
		res.render('login/register', {
			config: config,
			session: req.session
		});
	}
};

var invite = function(req, res) {
	if (req.session.is_login) {
		res.redirect('home');
	} else {
		var email = req.body.email.trim(),
		nick = req.body.nick.trim(),
		proxy = new EventProxy(),
		render = function(findEmail, sendMail) {
			var message = '发信失败了，联系下管理员小爝吧...';
			if (findEmail && sendMail) {
				message = '我们已经给您的' + email + '邮箱寄了一封激活信，它的有效期为3小时，如果收件箱中没有收到，麻烦您检查您的垃圾邮件夹~，也许会有惊喜...';
			}
			util.setNoCache(res);
			req.session.title = '激活页面';
			req.session.template = 'invite';
			res.render('login/invite', {
				config: config,
				session: req.session,
				message: message
			});
		};

		proxy.assign('findEmail', 'sendMail', render);
		try {
			var activateURL = 'http://www.tuer.me/register/active/' + encodeURIComponent(base64.encode('accounts=' + email + '&timestamp=' + new Date().getTime() + '&nick=' + nick));
		} catch(e) {
			proxy.trigger('findEmail', 0);
			proxy.trigger('sendMail', 0);
            return;
		}
        
		tuerBase.findOne({
			accounts: email
		},
		'users', function(err, data) {
			if (err || data) {
				proxy.trigger('findEmail', 0);
				proxy.trigger('sendMail', 0);
			} else {
				mail.send_mail({
					to: email,
					subject: nick + '欢迎您注册兔耳！',
					html: '<p><b>Hi,' + nick + '! </b>欢迎注册兔耳网。</p><p>可以点击或者复制下面的连接来激活你的帐号。</p><p><a href="' + activateURL + '" target="_blank">' + activateURL + '</a></p>'
				},
				function(err, status) {
					proxy.trigger('findEmail', 1);
					proxy.trigger('sendMail', 1);
				});
			}
		});
	}
};

var active = function(req, res, next) {
	if (req.session.is_login) {
		res.redirect('home');
	} else {
		var password = util.random36(10),
		proxy = new EventProxy(),
		activeData = util.paramUrl(base64.decode(decodeURIComponent(req.params.active))),
		render = function(args) {
			var message, checkUrl = args[0],
			findAccounts = args[1],
			saveAccounts = args[2];
			if (checkUrl && findAccounts && saveAccounts) {
				message = activeData['accounts'] + ' 帐号已经被激活，您的密码是' + password + ', 您可以登录以后修改成自己喜欢的其他密码！';
			} else if (!checkUrl) {
				message = '激活的URL不合法或已经过期超时';
			} else if (!findAccounts) {
				message = '此帐号已经被激活了';
			} else if (!saveAccounts) {
				message = '激活失败请重试';
			}
			req.session.title = '激活页面';
			req.session.template = 'invite';
			res.render('login/invite', {
				config: config,
				session: req.session,
				message: message
			});
		};

		if (!activeData['accounts'] || ! activeData['timestamp'] || ! activeData['nick']) {
			proxy.immediate('render', render, [false]);
		} else if ((new Date()).getTime() - parseInt(activeData['timestamp'], 10) > 1000 * 60 * 60 * 3) {
			proxy.immediate('render', render, [false]);
		} else {
			tuerBase.findOne({
				accounts: activeData['accounts']
			},
			'users', function(err, user) {
				if (err || user) proxy.immediate('render', render, [true, false]);
				else {
					var md5 = crypto.createHash("md5");
					md5.update(password);
					pwd = md5.digest("hex");
					tuerBase.save({
						accounts: activeData['accounts'],
						pwd: pwd,
						nick: activeData['nick'],
						avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACO0lEQVR42u2ZaXOCMBCG/f9/TRFw6jHO9LDlEKQqrdyF7S697UwhkEDo+OH9mOR9shuSXUZhGMKQNboA/DcAcx/ByklAtTJQzBfQ7AL0bQGqncPaTeQCOAUh3HgxTK380+jMgT+1dNJybPA+vleAxTYtjVeZ/i4NIXX7LTokHSPVBqQxwM6PmIxXQZmHuFuAlZuCjovz0sLNugOg3SpTgSMAzdcZwLXHd/c7B1hiuAcNsHBeBABAdwBXwwfIuQOQLgB1Nd9iCmHIeUqzoeNDPFQA5xjhS7MQAFDADucWDjClJ/IWhEgxc/EAqg3CAEj+88ABXD8aNsBOPEAhFODpJDiFNMEAwg9xgOUfvRx5G6fbvbOLzD9FsN7x+5wu3bxxXdyqqOcFEAQ9dSXKfg8aaKWGTwhuja37fdrYvO4UZTr23plz/Zg9Gi13nntrkSBYAIxDIhfAEd8wUzRWRwreJawXlnAAMsQCEASSAZChKeZ1Hc2wopOuvV6mUE2AuWwAtPszO6sNMMGKznuK5AAg8xOspOqa/w7B4yC3ArAPEWhWxmz+U0YGD48dXWSuH8LGi0A3UxgbOe560dz4mRSMBs2p4tx3uIbDUNxXAmy8GGbWl2lajJfx3yBQrkFr6RbBxM0BaIIxGaaJe9QYN0wxM3aAcmDP5j9EB54JgAprCqdMuvWSegD0WZzTX0TJABQ8F8fnGgAq/f6Uzfy7xkZRDTAxQVoAUlAFILN5knfW+PoBYB1i6QGu7J+f1FebMjmuZa3kQAAAAABJRU5ErkJggg==',
						profile: 'nothing yet',
						firends: [],
						notebook: 0,
						pageurl: ''
					},
					'users', function(err, data) {
						proxy.immediate('render', render, [true, true, true]);
					});
					mail.send_mail({
						to: activeData['accounts'],
						subject: '您在兔耳的帐号已经被激活！',
						html: '您的帐号<b>' + activeData['accounts'] + '</b>在兔耳的密码为<b>' + password + '</b>,热泪欢迎你啊……'
					},
					function(err, status) {});
				}
			});
		}

	}
};

exports.index = index;
exports.invite = invite;
exports.active = active;

