/*
 * GET home page.
 */
var config = require('../lib/site.js'),
base64 = require('../lib/base64'),
mail = require('../lib/mail.js'),
fs = require('fs'),
path = require('path'),
base = require('../model/base.js'),
util = require('../lib/util.js'),
uploadDir = require('../lib/site.js').uploadDir,
pag = require('../lib/pag').pag,
rss = require('rss'),
Avatar = require('../lib/avatar'),
jade = require('jade');

var tuerBase = new base.tuerBase('127.0.0.1', 10001);
var escape = jade.runtime.escape;

function settime(data) {
	var D = new Date(data['created_at']);
	data['created_at'] = D.getFullYear() + '-' + (D.getMonth() + 1) + '-' + D.getDate() + ' ' + D.getHours() + ':' + D.getMinutes() + ':' + D.getSeconds();
}

function setday(data) {
	var D = new Date(data['created_at']);
	data['created_at'] = D.getFullYear() + '-' + (D.getMonth() + 1) + '-' + D.getDate();
}

function setNoCache(res) {
	res.header('expires', 'Sun, 1 Jan 2006 01:00:00 GMT');
	res.header('cache-control', 'no-cache,must-revalidate,private,no-store');
	res.header('pragma', 'no-cache');
}

function _renderPage(req, res, temp, conf) {
	var _conf = {
		footer: config.footer,
		operate: config.nav,
		scripts: config.scripts.global.join(','),
		is_login: false,
		userid: null,
		rss: null
	};
	if (conf) util.mix(_conf, conf);
	if (req.session.userid) {
		_conf['is_login'] = true;
		_conf['userid'] = req.session.userid;
		_conf['operate'] = config.loginnav;
		var tempinfo = {};
		var isSelf = req.session.userid ? (req.session.userid == req.params.id) : false;
		for (var i in _conf['info']['muens']) {
			tempinfo[i] = _conf['info']['muens'][i];
			if (i == '首页') {
				tempinfo[i]['active'] = temp == 'index' ? 'active': '';
				tempinfo['Profile'] = {
					href: '/profile/' + req.session.userid,
					title: '我的主页',
					text: '我的主页',
					active: (temp == 'profile' && isSelf) ? 'active': ''
				};
			}
			if (i == '全部日记') {
				tempinfo[i]['active'] = temp == 'diary' ? 'active': '';
				tempinfo['Friend'] = {
					href: '/friend_diary/',
					title: '关注日记',
					text: '关注日记',
					active: (temp == 'friend_diary') ? 'active': ''
				};
			}
			//break;
		}
		_conf['info']['muens'] = tempinfo;
	}
	if (req.session.userid && (temp == 'invite' || temp == 'register' || temp == 'login' || temp == 'forgot')) res.redirect('set');
	else if (!req.session.userid && temp == 'set') res.redirect('login');
	else res.render(temp, _conf);
}

exports.ie = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(['/ie', 'Your browser we are not supported'], 'Sorry,your browser we are not supported');
	_renderPage(req, res, 'ie', {
		info: pageInfo
	});
};

exports.search = function(req, res) {
	var q = decodeURIComponent(encodeURI(req.query.q)),
	pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(['/search', 'Sorry,nothing searched'], 'Sorry,nothing searched');
	if (!q || q.trim() === '') {
		_renderPage(req, res, 'search', {
			info: pageInfo,
			result: [{
				title: 'Nothing searched'
			}]
		});
	} else {
        var qstr = util.replaceReg(q);
		var searchReg = new RegExp('.*' + qstr + '|' + qstr + '.*', 'i');
		tuerBase.findBy({
			title: searchReg
		},
		'diary', 10, function(err, diarylist) {
			if (err) throw err;
			else {
				if (!diarylist.length) diarylist = [{
					title: 'Nothing searched'
				}];
				else pageInfo['currentPage'] = util.setCur(['/search', q + ' searched results'], 'Search results');
				_renderPage(req, res, 'search', {
					info: pageInfo,
					result: diarylist
				});
			}
		});
	}
};

exports.index = function(req, res) {
	tuerBase.findAllDiary(15, function(err, diarys) {
		if (!err) {
			diarys.forEach(function(list) {
				settime(list);
				list['content'] = list['content'].length > 200 ? list['content'].slice(0, 200) + '...': list['content'];
				list['img'] = util.getpics(150, 1, list['filelist']);
				list['avatarUrl'] = Avatar.getUrl(list['userid']);
			});
			var pageInfo = util.setCurrent(config.muens, '首页');
			tuerBase.getCount({},
			'users', function(err, userscount) {
				if (err) res.redirect('404');
				else {
					tuerBase.getCount({
						privacy: 0
					},
					'diary', function(err, diarycount) {
						if (err) res.redirect('404');
						else {
							tuerBase.getCount({
								privacy: '1'
							},
							'diary', function(err, privacycount) {
								if (err) res.redirect('404');
								else {
									var D = new Date();
									var lefttime = (24 * 60 - (D.getHours() * 60 + D.getMinutes()));
									var time = '距离明天还有：' + Math.floor(lefttime / 60) + '小时' + lefttime % 60 + '分钟';
									if (req.session.userid) {
										tuerBase.findUser(req.session.userid, function(err, data) {
											if (err) res.redirect('404');
											else {
												_renderPage(req, res, 'index', {
													info: pageInfo,
													data: data,
													diary: diarys,
													time: time,
													//users: users,
													counts: {
														user: userscount,
														diary: diarycount,
														privacycount: privacycount
													}
												});
											}
										});
									} else {
										_renderPage(req, res, 'index', {
											info: pageInfo,
											diary: diarys,
											//users: users,
											time: time,
											counts: {
												user: userscount,
												diary: diarycount,
												privacycount: privacycount
											}
										});
									}
								}
							});
						}
					});
				}
			});
		} else {
			res.redirect('404');
		}
	});
};

exports.diarys = function(req, res) {
	var page = req.params.page;
	if (page && isNaN(page)) {
		res.redirect('404');
		return;
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}
	var space = 15,
	split = page * space,
	pageInfo = util.setCurrent(config.muens, '全部日记');
	tuerBase.findDiarySlice(split, split + space, function(err, lists) {
		if (!err) {
			lists.forEach(function(list) {
				settime(list);
				list['content'] = list['content'].length > 200 ? list['content'].slice(0, 200) + '...': list['content'];
				list['img'] = util.getpics(150, 1, list['filelist']);
				list['avatarUrl'] = Avatar.getUrl(list['userid']);
			});
			tuerBase.getCount({
				privacy: 0
			},
			'diary', function(err, count) {
				if (!err) {
					_renderPage(req, res, 'diary', {
						diary: lists,
						info: pageInfo,
						pag: new pag({
							cur: page + 1,
							space: space,
							total: count,
							url: '/diarys'
						}).init()
					});
				} else {
					console.log(err);
					res.redirect('404');
				}
			});
		} else {
			console.log(err);
		}
	});
};

exports.friend_diary = function(req, res) {
	var page = req.params.page;
	if (page && isNaN(page)) {
		res.redirect('404');
		return;
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}
	var space = 15,
	split = page * space,
	pageInfo = util.setCurrent(config.muens, null);
	tuerBase.findById(req.session._id, 'users', function(err, user) {
		if (err) {
			res.redirect('404');
			return;
		}
		pageInfo['currentPage'] = util.setCur(['/friend_diary/', user.nick + '关注的日记'], 'Friend');
		tuerBase.findDiaryByUsers(user.firends, false, split, split + space, function(err, lists) {
			if (!err) {
				lists.forEach(function(list) {
					settime(list);
					list['content'] = list['content'].length > 200 ? list['content'].slice(0, 200) + '...': list['content'];
					list['img'] = util.getpics(150, 1, list['filelist']);
					list['avatarUrl'] = Avatar.getUrl(list['userid']);
				});
				user.firends.forEach(function(item, index) {
					user.firends[index] = item.toString();
				});
				tuerBase.getCount({
					privacy: 0,
					userid: {
						'$in': user.firends
					}
				},
				'diary', function(err, count) {
					if (!err) {
						if (user.firends.length !== 0 && lists.length === 0) {
							res.redirect('404');
							return;
						}
						_renderPage(req, res, 'friend_diary', {
							diary: lists,
							info: pageInfo,
							pag: new pag({
								cur: page + 1,
								space: space,
								total: count,
								url: '/friend_diary'
							}).init()
						});
					} else {
						console.log(err);
						res.redirect('404');
					}
				});
			} else {
				console.log(err);
			}
		});
	});
};

exports.followedusers = function(req, res) {
	tuerBase.findUser(req.params.uid, function(err, data) {
		if (err) res.redirect('404');
		else {
			var url = data._id,
			pageInfo = util.setCurrent(config.muens, null);
			if (data.pageurl !== '') url = data.pageurl;
			data['avatarUrl'] = Avatar.getArtUrl(data._id);
			pageInfo['currentPage'] = util.setCur(['/follows/' + url, '关注' + data.nick + '的人'], 'follows');
			tuerBase.findFollows(data._id, data.firends.length, function(err, follows) {
				if (err) {
					res.redirect('404');
				} else {
					follows.forEach(function(user, index) {
						follows[index]['avatarUrl'] = Avatar.getUrl(user._id);
					});
					_renderPage(req, res, 'userslist', {
						info: pageInfo,
						data: data,
						users: follows
					});
				}
			});
		}
	});
};

exports.followusers = function(req, res) {
	tuerBase.findUser(req.params.uid, function(err, data) {
		if (err) res.redirect('404');
		else {
			var url = data._id,
			pageInfo = util.setCurrent(config.muens, null);
			if (data.pageurl !== '') url = data.pageurl;
			data['avatarUrl'] = Avatar.getArtUrl(data._id);
			pageInfo['currentPage'] = util.setCur(['/followed/' + url, data.nick + '关注的人'], 'followed');
			if (data.firends.length) {
				tuerBase.findBy({
					_id: {
						'$in': data.firends
					}
				},
				'users', data.firends.length, function(err, users) {
					if (err) {
						res.redirect('404');
					} else {
						users.forEach(function(user, index) {
							users[index]['avatarUrl'] = Avatar.getUrl(user._id);
						});
						_renderPage(req, res, 'userslist', {
							info: pageInfo,
							data: data,
							users: users
						});
					}
				});
			} else {
				_renderPage(req, res, 'userslist', {
					info: pageInfo,
					data: data,
					users: []
				});

			}
		}
	});
};

exports.profile = function(req, res) {
	tuerBase.findUser(req.params.id, function(err, data) {
		if (err) {
			res.redirect('404');
		} else {
			var url = data._id,
			pageInfo = util.setCurrent(config.muens, null);
			if (data.pageurl !== '') url = data.pageurl;
			var isSelf = req.session.userid ? (req.session.userid == url) : false;
			pageInfo['currentPage'] = util.setCur(['/profile/' + url, data.nick + '的主页'], 'Profile');
			tuerBase.findDiaryCount(data._id, isSelf, function(err, count) {
				if (!err) {
					tuerBase.findDiaryByUserId(data._id, isSelf, 0, 6, function(err, lists) {
						if (!err) {
							setday(data);
							lists.forEach(function(list) {
								settime(list);
								list['content'] = list['content'].length > 200 ? list['content'].slice(0, 200) + '...': list['content'];
								list['created_user'] = data['nick'];
								list['img'] = util.getpics(150, 1, list['filelist']);
							});
							data.diarycount = count;
							var friends = [];
							data.isFriend = function() {
								if (!req.session._id) return false;
								for (var i = 0; i < req.session.data.firends.length; i++) {
									if (req.session.data.firends[i] == data._id) return true;
								}
								return false;
							} ();
							tuerBase.findFollows(data._id, 6, function(err, follows, followscount) {
								follows.forEach(function(user, index) {
									follows[index]['avatarUrl'] = Avatar.getUrl(user._id);
								});
								data['avatarUrl'] = Avatar.getArtUrl(data._id);
								if (err) throw err;
								else {
									if (data.firends.length) {
										tuerBase.findBy({
											_id: {
												'$in': data.firends
											}
										},
										'users', 6, function(err, users) {
											users.forEach(function(user, index) {
												users[index]['avatarUrl'] = Avatar.getUrl(user._id);
											});
											_renderPage(req, res, 'profile', {
												isSelf: isSelf,
												diary: lists,
												info: pageInfo,
												data: data,
												follows: follows,
												friendscount: data.firends.length,
												followscount: followscount,
												friends: users,
												rss: {
													address: 'diary/' + req.params.id,
													title: data.nick + '\'s diaries'
												}
											});
										});
									} else {
										_renderPage(req, res, 'profile', {
											isSelf: isSelf,
											diary: lists,
											info: pageInfo,
											data: data,
											follows: follows,
											followscount: followscount,
											friendscount: data.firends.length,
											friends: friends,
											rss: {
												address: 'diary/' + req.params.id,
												title: data.nick + '\'s diaries'
											}
										});
									}
								}
							});
							if (!isSelf && req.session._id) {
								tuerBase.removeFriendsTips(req.session._id, data._id);
							}
						} else {
							console.log(err);
						}
					});
				}
			});
		}
	});
};

function renderDiarydetail(req, res, error) {
	var uid = req.params.uid,
	id = req.params.id;
	if (!uid || ! id) {
		res.redirect('404');
		return;
	}
	tuerBase.findUser(uid, function(err, data) {
		if (err) res.redirect('404');
		else {
			tuerBase.findById(id, 'diary', function(err, diary) {
				if (err) {
					res.redirect('404');
					return;
				}
				if (diary.privacy == 1 && data._id != req.session._id) {
					res.redirect('404');
					return;
				}
				var url = data._id,
				pageInfo = util.setCurrent(config.muens, null);
				if (data.pageurl !== '') url = data.pageurl;
				pageInfo['currentPage'] = util.setCur(['/profile/' + url + '/diary/' + diary._id, diary.title], diary.title);
				var isSelf = req.session.userid ? (req.session.userid == url) : false;
				diary.created_user = data.nick;
				settime(diary);
				data['avatarUrl'] = Avatar.getUrl(data._id);
				diary['content'] = escape(diary['content']).replace(/\n\r/g, '<br>');
				tuerBase.findComment(id, 300, function(err, comments) {
					comments.forEach(function(comment, index) {
						settime(comment);
						comments[index]['avatarUrl'] = Avatar.getUrl(comment.userid);
						if (comment.userid !== req.session._id && req.session._id) comments[index]['reply'] = true;
					});
					if (!err) {
						if (diary.userid == req.session._id) {
							comments.forEach(function(comment, index) {
								comments[index]['del'] = true;
							});
						} else {
							comments.forEach(function(comment, index) {
								if (comment.userid == req.session._id) {
									comments[index]['del'] = true;
								}
							});
						}
						diary['img'] = util.getpics(300, 1, diary['filelist']);
						diary['bigimg'] = util.getpics(500, 1, diary['filelist']);
						if (req.session._id) tuerBase.removeDiaryTips(req.session._id, diary._id);
						_renderPage(req, res, 'diarydetail', {
							isSelf: isSelf,
							diary: diary,
							info: pageInfo,
							data: data,
							comments: comments,
							error: error
						});
					} else {
						console.log(err);
					}
				});
			});
		}
	});
}

exports.addFriend = function(req, res) {
	if (req.session._id) {
		var userid = req.body.addid,
		addid = req.session._id;
		tuerBase.addFriends(userid, addid, function(err, msg) {
			var ret = msg || err;
			tuerBase.findById(req.session._id, 'users', function(err, data) {
				if (err) throw err;
				else req.session.data = data;
				res.header('Content-Type', 'application/json');
				res.send('{"msg":"' + ret + '"}');
			});
		});
	} else {
		res.redirect('404');
	}
};

exports.removeFriend = function(req, res) {
	if (req.session._id) {
		var userid = req.session._id,
		removeid = req.body.removeid;
		tuerBase.removeFriend(userid, removeid, function(err, msg) {
			var ret = msg || err;
			tuerBase.findById(req.session._id, 'users', function(err, data) {
				if (err) throw err;
				else req.session.data = data;
				res.header('Content-Type', 'application/json');
				res.send('{"msg":"' + ret + '"}');
			});
		});
	} else {
		res.redirect('404');
	}
};

exports.tips = function(req, res) {
	if (req.session._id) {
		tuerBase.findTipsByUserId(req.session._id, function(err, data) {
			res.header('Content-Type', 'application/json');
			if (err) {
				res.send('{"error":' + err + '}');
			} else {
				res.send('{"data":' + JSON.stringify(data) + '}');
			}
		});
	} else {
		res.redirect('404');
	}
};

exports.diarydetail = function(req, res) {
	renderDiarydetail(req, res, req.session.globalerror);
	if (req.session.globalerror) req.session.globalerror = undefined;
};

exports.diarylist = function(req, res) {
	var page = req.params.page,
	space = 6;
	if (page && isNaN(page)) {
		res.redirect('404');
		return;
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}
	tuerBase.findUser(req.params.id, function(err, data) {
		if (err) {
			res.redirect('404');
		} else {
			var url = data._id,
			pageInfo = util.setCurrent(config.muens, null);
			if (data.pageurl !== '') url = data.pageurl;
			pageInfo['currentPage'] = util.setCur(['/diary/' + url, data.nick + ' \'s page'], '日记');
			var isSelf = req.session.userid ? (req.session.userid == url) : false;
			tuerBase.findDiaryCount(data._id, isSelf, function(err, count) {
				if (!err) {
					var split = page * space;
					tuerBase.findDiaryByUserId(data._id, isSelf, split, split + space, function(err, lists) {
						if (!err) {
							settime(data);
							lists.forEach(function(list) {
								settime(list);
								list['content'] = list['content'].length > 200 ? list['content'].slice(0, 200) + '...': list['content'];
								list['created_user'] = data['nick'];
								list['img'] = util.getpics(150, 1, list['filelist']);
							});
							_renderPage(req, res, 'diarylist', {
								isSelf: isSelf,
								diary: lists,
								info: pageInfo,
								data: data,
								pag: new pag({
									cur: page + 1,
									space: space,
									total: count,
									url: '/diary/' + (data.pageurl === '' ? data._id: data.pageurl)
								}).init()
							});
						} else {
							console.log(err);
						}
					});
				}
			});
		}
	});
};

exports.register = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(config.nav.SignIn, 'SignIn');
	_renderPage(req, res, 'register', {
		info: pageInfo
	});
};

exports.active = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null),
	password = util.random36(10),
	message,
	activeData = util.paramUrl(base64.decode(decodeURIComponent(req.params.active)));
	pageInfo['currentPage'] = util.setCur(config.page.Invite, 'Invite');
	function _render(msg) {
		setNoCache(res);
		_renderPage(req, res, 'invite', {
			info: pageInfo,
			message: msg
		});
	}
	//check time and email
	if (!activeData['accounts'] || ! activeData['timestamp'] || ! activeData['nick']) {
		message = 'wrongful url';
		_render(message);
	} else if ((new Date()).getTime() - parseInt(activeData['timestamp'], 10) > 1000 * 60 * 60 * 3) {
		message = 'this url is timeout last three hours';
		_render(message);
	} else {
		tuerBase.findOne({
			accounts: activeData['accounts']
		},
		'users', function(err, data) {
			if (err) {
				_render(err);
			}
			else if (data) {
				message = 'the accounts is actived yet.';
				_render(message);
			} else {
				mail.send_mail({
					to: activeData['accounts'],
					subject: '您在兔耳的帐号已经被激活！',
					html: '您的帐号<b>' + activeData['accounts'] + '</b>在兔耳的密码为<b>' + password + '</b>,热泪欢迎你啊……'
				},
				function(err, status) {
					tuerBase.save({
						accounts: activeData['accounts'],
						pwd: password,
						nick: activeData['nick'],
						avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACO0lEQVR42u2ZaXOCMBCG/f9/TRFw6jHO9LDlEKQqrdyF7S697UwhkEDo+OH9mOR9shuSXUZhGMKQNboA/DcAcx/ByklAtTJQzBfQ7AL0bQGqncPaTeQCOAUh3HgxTK380+jMgT+1dNJybPA+vleAxTYtjVeZ/i4NIXX7LTokHSPVBqQxwM6PmIxXQZmHuFuAlZuCjovz0sLNugOg3SpTgSMAzdcZwLXHd/c7B1hiuAcNsHBeBABAdwBXwwfIuQOQLgB1Nd9iCmHIeUqzoeNDPFQA5xjhS7MQAFDADucWDjClJ/IWhEgxc/EAqg3CAEj+88ABXD8aNsBOPEAhFODpJDiFNMEAwg9xgOUfvRx5G6fbvbOLzD9FsN7x+5wu3bxxXdyqqOcFEAQ9dSXKfg8aaKWGTwhuja37fdrYvO4UZTr23plz/Zg9Gi13nntrkSBYAIxDIhfAEd8wUzRWRwreJawXlnAAMsQCEASSAZChKeZ1Hc2wopOuvV6mUE2AuWwAtPszO6sNMMGKznuK5AAg8xOspOqa/w7B4yC3ArAPEWhWxmz+U0YGD48dXWSuH8LGi0A3UxgbOe560dz4mRSMBs2p4tx3uIbDUNxXAmy8GGbWl2lajJfx3yBQrkFr6RbBxM0BaIIxGaaJe9QYN0wxM3aAcmDP5j9EB54JgAprCqdMuvWSegD0WZzTX0TJABQ8F8fnGgAq/f6Uzfy7xkZRDTAxQVoAUlAFILN5knfW+PoBYB1i6QGu7J+f1FebMjmuZa3kQAAAAABJRU5ErkJggg==',
						profile: 'nothing yet',
						firends: [],
						pageurl: ''
					},
					'users', function(err, data) {
						if (status.message) message = activeData['accounts'] + ' 帐号已经被激活，您的密码是' + password + ', 您可以登录以后修改成自己喜欢的其他密码！';
						else if (err) message = err;
						else message = '发信失败了，联系下管理员小爝吧。。';
						_render(message);
					});
				});
			}
		});
	}
};

exports.invite = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null),
	message,
	email = req.body.email,
	nick = req.body.nick,
	activateURL = 'http://www.tuer.me/register/active/' + encodeURIComponent(base64.encode('accounts=' + email + '&timestamp=' + new Date().getTime() + '&nick=' + nick));
	pageInfo['currentPage'] = util.setCur(config.page.Invite, 'Invite');
	function _render(msg) {
		setNoCache(res);
		_renderPage(req, res, 'invite', {
			info: pageInfo,
			message: msg
		});
	}
	tuerBase.findOne({
		accounts: email
	},
	'users', function(err, data) {
		if (err) {
			_render(err);
		} else if (data) {
			message = email + ' adress is registered.';
			_render(message);
		} else {
			mail.send_mail({
				to: email,
				subject: nick + '欢迎您注册兔耳！',
				html: '<p><b>Hi,' + nick + '! </b>欢迎注册兔耳网。</p><p>可以点击或者复制下面的连接来激活你的帐号。</p><p><a href="' + activateURL + '" target="_blank">' + activateURL + '</a></p>'
			},
			function(err, status) {
				if (status.message) message = '我们已经给您的' + email + '邮箱寄了一封激活信，它的有效期为3小时，如果收件箱中没有收到，麻烦您检查您的垃圾邮件夹~，也许会有惊喜...';
				else message = '发信失败了，联系下管理员小爝吧...';
				_render(message);
			});
		}
	});
};

function _renderlogin(req, res, error) {
	var pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(config.nav.Login, 'Login');
	_renderPage(req, res, 'login', {
		info: pageInfo,
		error: error
	});
}

exports.login = function(req, res) {
	_renderlogin(req, res, false);
};

exports.signin = function(req, res) {
	if (req.body.email && req.body.pwd) {
		var accounts = req.body.email,
		pwd = req.body.pwd,
		remember = req.body.remember;
		tuerBase.findOne({
			accounts: accounts
		},
		'users', function(err, data) {
			if (err || ! data) _renderlogin(req, res, err || 'accounts is not exist');
			else {
				if (data['pwd'] == pwd) {
					if (data['pageurl'] === '') req.session.userid = data._id;
					else req.session.userid = data['pageurl'];
					req.session._id = data['_id'];
					req.session.name = data['nick'];
					req.session.data = data;
					res.redirect('home');
				} else {
					_renderlogin(req, res, 'password is wrong!');
				}
			}
		});
	} else {
		res.redirect('login');
	}
};

exports.forgot = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(config.page.Forgot, 'Forgot');
	_renderPage(req, res, 'forgot', {
		info: pageInfo
	});
};

exports.about = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(config.footer.About, 'about');
	_renderPage(req, res, 'about', {
		info: pageInfo
	});
};

exports.help = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(config.footer.Help, 'help');
	_renderPage(req, res, 'help', {
		info: pageInfo
	});
};

exports.findpwd = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null),
	email = req.body.email;
	pageInfo['currentPage'] = util.setCur(config.page.Forgot, 'Forgot');
	function _render(msg) {
		setNoCache(res);
		_renderPage(req, res, 'invite', {
			info: pageInfo,
			message: msg
		});
	}
	tuerBase.findOne({
		accounts: email
	},
	'users', function(err, data) {
		if (err) {
			_render(err);
		} else if (data) {
			var password = data['pwd'];
			mail.send_mail({
				to: email,
				subject: '您在兔耳的密码!',
				html: '<p>这是您的密码 ' + password + ',我们一直在等候着您!</p>'
			},
			function(err, status) {
				if (status) _render('已经发了邮件到您注册的邮箱里了，请及时查收。');
				else _render('又出问题了？联系下管理员小爝同学吧。。');
			});
		} else {
			_render(email + ' 这个邮箱根本没注册过啊。。');
		}
	});
};

exports.logout = function(req, res) {
	if (req.session.userid) {
		req.session.destroy(function(err) {
			res.redirect('login');
		});
	} else {
		res.redirect('login');
	}
};

function renderSet(req, res, message) {
	var pageInfo = util.setCurrent(config.muens, null),
	id = req.session.userid;
	tuerBase.findUser(id, function(err, data) {
		if (err) res.redirect('login');
		else {
			pageInfo['currentPage'] = util.setCur(config.page.Set, 'Set Account');
			var renderData = {
				info: pageInfo,
				data: data,
				message: false
			};
			if (message) renderData['message'] = message;
			_renderPage(req, res, 'set', renderData);
		}
	});
}

exports.set = function(req, res) {
	renderSet(req, res);
};

exports.saveset = function(req, res) {
	var id = req.session.userid,
	avatar = req.body.avatar,
	nick = req.body.nick,
	password = req.body.password,
	profile = req.body.profile,
	pageurl = req.body.soleurl;
	//check by server
	if (avatar.trim() === '') {
		renderSet(req, res, '头像也不能为空啊..');
		return;
	}
	if (nick.trim() === '') {
		renderSet(req, res, '昵称不能为空啊');
		return;
	}
	if (password.trim() === '' || password.length < 5 || password.length > 15) {
		renderSet(req, res, '密码别少于5个大于15个字符噢');
		return;
	}
	if (profile.length > 40) {
		renderSet(req, res, '签名别多过40个字符啦');
		return;
	}
	if (pageurl && (pageurl.length > 10 || (/[^0-9a-z]/g).test(pageurl))) {
		renderSet(req, res, '唯一地址最好少于是个字节和不带标点的噢');
		return;
	}

	//check pageurl 
	if (pageurl && pageurl !== '') {
		tuerBase.findOne({
			pageurl: pageurl
		},
		'users', function(err, data) {
			if (err) renderSet(req, res, err);
			else {
				if (data) {
					renderSet(req, res, 'pageurl is repeat');
					return;
				} else {
					updateSet();
				}
			}
		});
	} else {
		updateSet();
	}

	// to do update
	function updateSet() {
		var updateDB = {
			nick: nick,
			pwd: password,
			avatar: avatar,
			profile: profile === '' ? 'nothing yet': profile
		},
		haspageurl;

		if (pageurl && pageurl !== '') {
			updateDB['pageurl'] = pageurl;
			haspageurl = true;
		}

		//update db
		tuerBase.updateById(id, {
			$set: updateDB
		},
		'users', function(err, result) {
			if (err) renderSet(req, res, err);
			else {
				if (haspageurl) req.session.userid = pageurl;
				res.redirect('set');
			}
		});
	}
};

exports.nofound = function(req, res) {
	var pageInfo = util.setCurrent(config.muens, null);
	pageInfo['currentPage'] = util.setCur(config.page.nofound, '没有找到你想要的页面啊亲~');
	_renderPage(req, res, '404', {
		info: pageInfo
	});
};

function renderWrite(req, res, error) {
	var pageInfo = util.setCurrent(config.muens, null),
	id = req.session.userid;
	if (id) {
		tuerBase.findUser(id, function(err, data) {
			if (err) res.redirect('login');
			else {
				pageInfo = util.setCurrent(config.muens, null);
				pageInfo['currentPage'] = util.setCur(['/write/', 'write a new diary'], 'write');
				var pagedata = {
					info: pageInfo,
					data: data,
					action: '/savediary',
					diarydata: {
						title: '',
						content: ''
					}
				};
				pagedata['error'] = error ? error: false;
				_renderPage(req, res, 'write', pagedata);
			}
		});
	} else {
		res.redirect('login');
	}
}

exports.editdiary = function(req, res) {
	var id = req.params.id;
	tuerBase.findById(id, 'diary', function(err, diarydata) {
		if (err) res.redirect('404');
		else {
			var pageInfo = util.setCurrent(config.muens, null),
			id = req.session.userid;
			if (id) {
				tuerBase.findUser(id, function(err, data) {
					if (err) res.redirect('login');
					else {
						if (diarydata.userid == data._id) {
							pageInfo = util.setCurrent(config.muens, null);
							pageInfo['currentPage'] = util.setCur(['/editdiary/', 'edit diary'], 'edit diary');
							diarydata['img'] = util.getpics(80, 1, diarydata['filelist']);
							var pagedata = {
								info: pageInfo,
								data: data,
								action: '/updatediary',
								diarydata: diarydata
							};
							pagedata['error'] = false;
							_renderPage(req, res, 'write', pagedata);
						} else {
							res.redirect('home');
						}
					}
				});
			} else {
				res.redirect('login');
			}
		}
	});
};

exports.deletediary = function(req, res) {
	var userid = req.session._id,
	id = req.body.id;
	if (userid) {
		tuerBase.findById(id, 'diary', function(err, now) {
			if (!err && now.userid == userid) {
				tuerBase.findById(id, 'diary', function(err, data) {
					if (err) console.log(err);
					else {
						if (userid == data['userid']) {
							tuerBase.removeById(id, 'diary', function(err, ret) {
								var filelist = data['filelist'] || {};
								util.removePic(filelist, function(err) {
									console.log(err);
								});
								tuerBase.removeBy({
									related_id: id
								},
								'comment', function(err, ret) {
									if (!err) {
										console.log(ret);
									}
								});
								res.redirect('home');
							});
						} else {
							res.redirect('home');
						}
					}
				});
			} else {
				res.redirect('home');
			}
		});
	} else {
		res.redirect('login');
	}
};

exports.commentpag = function(req,res){
    
};

exports.savecomment = function(req, res) {
	var userid = req.session._id;
	if (userid) {
		var content = req.body.content,
		replyid = req.body.replyid,
		replyname = req.body.replyname,
		diaryid = req.body.diaryid;
		//校验
		if (content.length <= 0 || content.length > 220) {
			req.session.globalerror = '评论内容要少于220个字节啊...!';
			res.redirect('/profile/' + req.session.userid + '/diary/' + diaryid);
			return;
		}
		var saveData = {
			content: content,
			related_id: diaryid,
			userid: userid
		};

		if (replyid && replyname) {
			saveData['content'] = '@' + replyname + ' ' + content;
		}

		tuerBase.findById(diaryid, 'diary', function(err, diarydata) {
			if (!err) {
                if(diarydata.forbid == 1){
                    req.session.globalerror = '此日记不允许被评论';
			        res.redirect('/profile/' + req.session.userid + '/diary/' + diaryid);
                    return;    
                }
				tuerBase.save(saveData, 'comment', function(err, data) {
					if (!err) {
						tuerBase.update({
							_id: diarydata._id
						},
						{
							'$inc': {
								'commentcount': 1
							}
						},
						'diary', function(err) {
							if (!err) {
								if (diarydata.userid !== userid) tuerBase.addDiaryTips(diarydata.userid, diaryid);
								if (replyid && replyid != userid) tuerBase.addDiaryTips(replyid, diaryid);
							}
						});
					}
				});
				res.redirect('back');
			} else {
				res.redirect('404');
			}
		});
	} else {
		res.redirect('login');
	}
};

exports.deletecomment = function(req, res) {
	var userid = req.session._id;
	if (userid) {
		var commentid = req.body.commentid,
		diaryid = req.body.diaryid;
		tuerBase.findById(commentid, 'comment', function(err, comment) {
			if (!err) {
				tuerBase.findById(diaryid, 'diary', function(err, diary) {
					if (comment.related_id == userid) {
						deletecomment(commentid, diary._id, comment);
					} else {
						if (!err) {
							if (diary.userid == userid || comment.userid == userid) {
								deletecomment(commentid, diary._id, comment);
							} else {
								res.redirect('404');
							}
						} else {
							res.redirect('404');
						}
					}
				});
			} else {
				res.redirect('404');
			}
		});
	} else {
		res.redirect('login');
	}

	function deletecomment(id, diaryid, comment) {
		tuerBase.removeById(id, 'comment', function(err) {
			if (!err) {
				//发邮件到用户信箱备份  
				tuerBase.findById(comment.userid, 'users', function(err, user) {
					if (!err) {
						tuerBase.update({
							_id: diaryid
						},
						{
							'$inc': {
								'commentcount': - 1
							}
						},
						'diary', function(err) {
							if (!err) {
								res.redirect('back');
							}
						});
						mail.send_mail({
							to: user['accounts'],
							subject: '您在兔耳网的评论被删除了!',
							html: '下面是您的评论备份.<br/> ----------<br/> ' + comment.content
						},
						function(err, status) {
							console.log(status);
						});
					} else {
						res.redirect('404');
					}
				});
			} else {
				res.redirect('404');
			}
		});
	}
};

exports.write = function(req, res) {
	renderWrite(req, res);
};

exports.updatediary = function(req, res) {
	var userid = req.session._id;
	if (userid) {
		var title = req.body.title,
		diaryid = req.body.id,
		content = req.body.content,
		forbid = req.body.forbid || 0,
		privacy = req.body.privacy || 0,
		tmp_paths = [],
		target_paths = [],
		filelist = {};
		//校验一下需要
		if (!util.notHasfiles(req.files)) {
			var i = 0,
			pic;
			for (pic in req.files) {
				i++;
				if (i > 5) {
					renderWrite(req, res, 'pics numbers must less 5');
					break;
				}
				if (req.files[pic].size > 20971520) {
					renderWrite(req, res, 'pic size too large,must less 2MB');
					i = 6;
					break;
				}
				if (!req.files[pic].type.match(/jpg|png|jpeg|gif/gi)) {
					renderWrite(req, res, 'must be images files');
					i = 6;
					break;
				}
			}
			if (i > 5) {
				removeTemp(req.files);
				return;
			}
			for (p in req.files) {
				pic = req.files[p];
				var tmp_path = pic.path,
				picname = path.basename(tmp_path),
				target_path = uploadDir + picname;
				tmp_paths.push(tmp_path);
				target_paths.push(target_path);
			}
		} else if (!util.isEmptyObject(req.files)) {
			removeTemp(req.files);
		}

		if (!title || title.length > 20) {
			renderWrite(req, res, '标题不能大于20个字节噢！');
			removeTemp(req.files);
			return;
		}
		if (!content || content.length > 5500) {
			renderWrite(req, res, '内容最好在5500以下。。');
			removeTemp(req.files);
			return;
		}

		util.fiximages(tmp_paths, target_paths, filelist, function(err) {
			if (err) {
				renderWrite(req, res, err);
				util.removePic(filelist);
			} else {
				tuerBase.findById(diaryid, 'diary', function(err, now) {
					if (!err && now.userid == userid) {
						if (!util.notHasfiles(req.files)) {
							var list = now.filelist || {};
							if (util.isEmptyObject(list)) {
								now.filelist = filelist;
							} else {
								for (var i in list) {
									util.removePic(list);
									now.filelist = filelist;
								}
							}
						}
						tuerBase.updateById(diaryid, {
							$set: {
								title: title,
								content: content,
								filelist: now.filelist,
								forbid: forbid,
								privacy: privacy
							}
						},
						'diary', function(err, data) {
							if (err) {
								console.log(err);
							} else {
								res.redirect('home');
							}
						});
					} else {
						res.redirect('home');
					}
				});
			}
		});

	} else {
		res.redirect('login');
	}
};

function removeTemp(files) {
	for (var k in files) {
		var tmp = files[k]['path'];
		try {
			fs.unlinkSync(tmp);
		} catch(e) {}
	}
}

exports.savediary = function(req, res) {
	var userid = req.session._id;
	if (userid) {
		var title = req.body.title,
		filelist = {},
		tmp_paths = [],
		target_paths = [],
		privacy = req.body.privacy || 0,
		forbid = req.body.forbid || 0,
		content = req.body.content;
		//校验一下需要
		if (!util.notHasfiles(req.files)) {
			var i = 0,
			pic;
			for (pic in req.files) {
				i++;
				if (i > 5) {
					renderWrite(req, res, 'pics numbers must less 5');
					break;
				}
				if (req.files[pic].size > 20971520) {
					renderWrite(req, res, 'pic size too large,must less 2MB');
					i = 6;
					break;
				}
				if (!req.files[pic].type.match(/jpg|png|jpeg|gif/gi)) {
					renderWrite(req, res, 'must be images files');
					i = 6;
					break;
				}
			}
			if (i > 5) {
				removeTemp(req.files);
				return;
			}
			for (p in req.files) {
				pic = req.files[p];
				var tmp_path = pic.path,
				picname = path.basename(tmp_path),
				target_path = uploadDir + picname;
				tmp_paths.push(tmp_path);
				target_paths.push(target_path);
			}
		} else if (!util.isEmptyObject(req.files)) {
			removeTemp(req.files);
		}

		if (!title || title.length > 20) {
			renderWrite(req, res, '标题不能大于20个字节噢！');
			removeTemp(req.files);
			return;
		}
		if (!content || content.length > 5500) {
			renderWrite(req, res, '内容最好在5500以下。。');
			removeTemp(req.files);
			return;
		}

		util.fiximages(tmp_paths, target_paths, filelist, function(err) {
			if (err) {
				renderWrite(req, res, err);
				util.removePic(filelist);
			} else {
				tuerBase.save({
					title: title,
					content: content,
					userid: userid,
					filelist: filelist,
					privacy: privacy,
					forbid: forbid,
					commentcount: 0
				},
				'diary', function(err, data) {
					if (err) {
						console.log(err);
					} else {
						res.redirect('home');
					}
				});
			}
		});
	} else {
		res.redirect('login');
	}
};

exports.diaryrss = function(req, res) {
	var uid = req.params.uid;
	tuerBase.findUser(uid, function(err, data) {
		if (err) {
			console.log(err);
			res.redirect('404');
		} else {
			var isSelf = req.session.userid ? (req.session.userid == url) : false;
			tuerBase.findDiaryByUserId(data._id, isSelf, 0, 10, function(err, list) {
				if (err) {
					console.log(err);
					res.redirect('404');
				} else {
					var feed = new rss({
						title: data.nick + '\'s diaries',
						description: data.nick + '\'s diaries in the tuer web site',
						feed_url: 'http://www.tuer.me/rss/diary/' + uid,
						site_url: 'http://www.tuer.me/profile/' + uid,
						author: data.nick
					});
					list.forEach(function(item, index) {
						feed.item({
							title: item['title'],
							description: item['content'],
							url: 'http://www.tuer.me/profile/' + uid + '/diary/' + item['_id'],
							author: data.nick,
							data: item['created_at']
						});
					});
					res.header('Content-Type', 'text/xml');
					res.send(feed.xml());
				}
			});
		}
	});
};

exports.avatar = function(req, res) {
	var uid = req.params.id;
	Avatar.getAvatar(uid, 48, 48, function(err, buf) {
		if (err) res.redirect('404');
		else {
			res.header('Content-Type', 'image/png');
			res.send(buf);
		}
	});
};

exports.art = function(req, res) {
	var uid = req.params.id;
	Avatar.getAvatar(uid, null, null, function(err, buf) {
		if (err) res.redirect('404');
		else {
			res.header('Content-Type', 'image/png');
			res.send(buf);
		}
	});
};
