var tuerBase = require('../model/base'),
config = require('../lib/config'),
base64 = require('../lib/base64'),
Avatar = require('../lib/avatar'),
crypto = require('crypto'),
EventProxy = require('eventproxy').EventProxy;

var index = function(req, res) {
	if (req.session.is_login) {
		res.redirect('home');
	} else {

		req.session.title = '登陆兔耳';
		req.session.template = 'login';
		req.session.error = req.flash('error');

		res.render('login/login', {
			config: config,
			session: req.session
		});
	}
};

var logout = function(req, res) {
	if (req.session.is_login) {
		req.session.destroy(function(err) {
			res.clearCookie('accounts', {
                path:'/',
				domain: '.tuer.me'
			});
			res.clearCookie('pwd', {
                path:'/',
				domain: '.tuer.me'
			});
			res.clearCookie('remember', {
                path:'/',
				domain: '.tuer.me'
			});
			res.redirect('home');
		});
	} else {
		res.redirect('home');
	}
};

var signsuccess = function(req, res, userdata, accounts, pwd, remember, callback) {
	var cookie_accounts = base64.encode(accounts),
	maxAge = config.timeout,
	// 2小时
	md5 = crypto.createHash("md5");
	md5.update(pwd);
	var cookie_pwd = base64.encode(md5.digest("hex"));
	if (remember) {
		maxAge = 1000 * 60 * 60 * 24 * 7; // 一周
		res.cookie('remember', 1, {
			maxAge: maxAge,
            path:'/',
			domain: ".tuer.me"
		});
	}
	res.cookie('accounts', cookie_accounts, {
		maxAge: maxAge,
        path:'/',
		domain: ".tuer.me"
	});
	res.cookie('pwd', cookie_pwd, {
		maxAge: maxAge,
        path:'/',
		domain: ".tuer.me"
	});
	req.session.cookie.expires = false;
	req.session.cookie.maxAge = config.timeout;
	req.session.is_login = true;
	req.session.userdata = userdata;
    req.session.userdata.avatar = Avatar.getUrl(userdata._id);
	if (callback) callback(res);
};

var cookies = function(req, res, next) {
	var accounts = req.cookies.accounts,
	pwd = req.cookies.pwd,
	remember = req.cookies.remember;
	//本地有cookie，session却失效了
	if (accounts && pwd) {
		accounts = base64.decode(accounts);
		pwd = base64.decode(pwd);
		tuerBase.findOne({
			accounts: accounts
		},
		'users', function(err, user) {
			if (err || ! user) {
                req.session.is_login = false;
                req.session.userdata = undefined;
				next();
			} else {
				var md5 = crypto.createHash("md5");
				md5.update(user.pwd);
				var userpwd = md5.digest("hex");
				if (userpwd == pwd) {
					signsuccess(req, res, user, accounts, user.pwd, remember, function(res) {
                        next();
					});
				} else {
                    req.session.is_login = false;
                    req.session.userdata = undefined;
					next();
				}
			}
		});
	} else {
        req.session.is_login = false;
        req.session.userdata = undefined;
        next();
	}
};

var signin = function(req, res) {
	if (req.session.is_login) {
		res.redirect('home');
	} else {
		var proxy = new EventProxy(),
		accounts = req.body.email.trim(),
		pwd = req.body.pwd.trim(),
		remember = req.body.remember,
		render = function(data) {
			var errorMap = {
				'001': '帐号不存在',
				'002': '帐号密码不正确'
			};
			if (errorMap.hasOwnProperty(data)) {
				req.flash('error', errorMap[data]);
				res.redirect('login');
			} else {
				signsuccess(req, res, data, accounts, pwd, remember, function(res) {
					res.redirect('home');
				});
			}
		};

		proxy.assign('findLoginuser', render);

		if (accounts && pwd) {
			var md5 = crypto.createHash("md5");
			md5.update(pwd);
			pwd = md5.digest("hex");
			tuerBase.findOne({
				accounts: accounts
			},
			'users', function(err, user) {
				if (err || ! user) {
					proxy.trigger('findLoginuser', '001');
				} else {
					if (user['pwd'] === pwd) {
						proxy.trigger('findLoginuser', user);
					} else {
						proxy.trigger('findLoginuser', '002');
					}
				}
			});
		} else {
			proxy.trigger('findLoginuser', '001');
		}
	}
};

exports.index = index;
exports.signin = signin;
exports.logout = logout;
exports.cookies = cookies;

