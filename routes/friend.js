var tuerBase = require('../model/base'),
config = require('../lib/config'),
EventProxy = require('eventproxy').EventProxy;

var add = function(req, res) {
	if (req.session.is_login) {
		var userid = req.body.addid,
		addid = req.session.userdata._id,
		proxy = new EventProxy(),
		render = function(user, msg) {
			req.session.userdata = user;
			res.header('Content-Type', 'application/json');
			res.send('{"msg":"' + msg + '"}');
		};

		proxy.assign('user', 'addFriend', render);

		tuerBase.addFriends(userid, addid, function(err, msg) {
			if (err) {
				res.redirect('json_error');
			} else {
				proxy.trigger('addFriend', msg);
				tuerBase.findById(addid, 'users', function(err, user) {
					if (err) {
						res.redirect('json_error');
					} else {
						proxy.trigger('user', user);
					}
				});
			}
		});

	} else {
		res.redirect('login');
	}
};

var remove = function(req, res) {
	if (req.session.is_login) {
		var userid = req.session.userdata._id,
		removeid = req.body.removeid,
		proxy = new EventProxy(),
		render = function(user, msg) {
			req.session.userdata = user;
			res.header('Content-Type', 'application/json');
			res.send('{"msg":"' + msg + '"}');
		};

		proxy.assign('user', 'removeFriend', render);

		tuerBase.removeFriend(userid, removeid, function(err, msg) {
			if (err) {
				res.redirect('json_error');
			} else {
				proxy.trigger('removeFriend', msg);
				tuerBase.findById(userid, 'users', function(err, user) {
					if (err) {
						res.redirect('json_error');
					} else {
						proxy.trigger('user', user);
					}
				});
			}
		});
	} else {
		res.redirect('login');
	}
};

exports.add = add;
exports.remove = remove;

