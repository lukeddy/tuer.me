var config = require('../../lib/config'),
tuerBase = require('../../model/base'),
EventProxy = require('eventproxy').EventProxy;

var save = function(req, res) {
	if (req.session.is_login) {
		var content = req.body.content,
		userid = req.session.userdata._id,
		replyid = req.body.replyid,
		replyname = req.body.replyname,
		diaryid = req.body.diaryid;
		//校验
        if(!diaryid){
			res.redirect('500');
            return;
        }
		if (content.length <= 0 || content.length > 220) {
			req.flash('error',"评论内容不能为空或超过220个字节");
			res.redirect('/diary/' + diaryid);
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
				if (diarydata.forbid == 1) {
					req.flash('error','此日记不允许被评论');
					res.redirect('/diary/' + diaryid);
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
		res.redirect('/');
	}
};

var remove = function(req, res) {
	if (req.session.is_login) {
		var userid = req.session.userdata._id,
		commentid = req.body.commentid,
		diaryid = req.body.diaryid,
		proxy = new EventProxy(),
		removeComment = function(comment, diary) {
			if (comment.related_id == userid || diary.userid == userid || comment.userid == userid) {
				deletecomment(commentid, diary._id, comment);
			} else {
				res.redirect('500');
			}
		};

		function deletecomment(id, diaryid, comment) {

			var deleteproxy = new EventProxy(),
			render = function(user) {
				res.redirect('back');
			};

			deleteproxy.assign('user', 'removecomment', 'updatecount', render);

			tuerBase.removeById(id, 'comment', function(err) {
				if (err) {
					res.redirect('500');
				} else {
					deleteproxy.trigger('removecomment');
				}
			});

			tuerBase.findById(comment.userid, 'users', function(err, user) {
				if (err) {
					res.redirect('500');
				} else {
                    deleteproxy.trigger('user',user);
                }
			});

			tuerBase.update({
				_id: diaryid
			},
			{
				'$inc': {
					'commentcount': - 1
				}
			},
			'diary', function(err) {
				if (err) {
					res.redirect('500');
				} else {
					deleteproxy.trigger('updatecount');
				}
			});
		}

		proxy.assign('comment', 'diary', removeComment);

		tuerBase.findById(commentid, 'comment', function(err, comment) {
			if (err) {
				res.redirect('500');
			} else {
				proxy.trigger('comment', comment);
			}
		});

		tuerBase.findById(diaryid, 'diary', function(err, diary) {
			if (err) {
				res.redirect('500');
			} else {
				proxy.trigger('diary', diary);
			}
		});

	} else {
		res.redirect('/');
	}
};

exports.save = save;
exports.remove = remove;
