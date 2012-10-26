var config = require('../../lib/config'),
tuerBase = require('../../model/base'),
EventProxy = require('eventproxy').EventProxy;

exports.index = function(req, res) {
	if (req.session.is_login) {
		res.redirect('/profile/' + req.session.userdata._id);
	} else {
		req.session.error = req.flash('error');
		res.render('wap/index', {
			title: '首页',
			session: req.session
		});
	}
};

