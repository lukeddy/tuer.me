var config = require('../../lib/config'),
tuerBase = require('../../model/base'),
crypto = require('crypto'),
EventProxy = require('eventproxy').EventProxy;

exports.index = function(req,res){
   if(!req.session.is_login) {
    res.redirect('/');
    return;
   }
   var uid = req.session.userdata._id;
   tuerBase.findUser(uid,function(err,user){
		req.session.success = req.flash('success');
		req.session.error = req.flash('error');
        res.render('wap/set/set',{
            title:'设置',
            session:req.session,
            user:user
        });
   });
};

exports.update = function(req,res){
	if (req.session.is_login) {
		var nick = req.body.nick,
		uid = req.session.userdata._id,
		profile = req.body.profile,
		successmsg = '设置修改成功',
		proxy = new EventProxy(),
		render = function(msg) {
			if (msg == successmsg) req.flash('success', msg);
			else req.flash('error', msg);
			res.redirect('back');
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

		var updateDB = {
			nick: nick,
			profile: profile === '' ? 'nothing yet': profile
		};

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
		res.redirect('/');
	}
};

exports.pwd = function(req, res) {
    if(req.session.is_login){
        var uid = req.session.userdata._id;
        tuerBase.findUser(uid,function(err,user){
			req.session.success = req.flash('success');
			req.session.error = req.flash('error');
			res.render('wap/set/pwd', {
				user: user,
                title:'修改密码',
				session: req.session
			});
        });
    }else{
        res.redirect('/');    
    }
};

exports.pwdSave = function(req, res) {
    if(req.session.is_login){
        var uid = req.session.userdata._id,
            oldpwd = req.body.old_pwd,
            newpwd = req.body.new_pwd,
            confirmpwd = req.body.confirm_pwd,
            successmsg = '修改密码成功',
            proxy = new EventProxy(),
            render = function(msg){
                if(msg == successmsg) req.flash('success',msg);
                else req.flash('error',msg);
                res.redirect('back');
            };

		proxy.assign('msg', render);
        
        if(newpwd != confirmpwd){
            proxy.trigger('msg','两次输入的修改密码不一致');
            return;
        }

        tuerBase.findUser(uid,function(err,user){
            if(err){
                proxy.trigger('msg',err);
            }else{
                var md5 = crypto.createHash("md5");
                md5.update(oldpwd);
                oldpwd = md5.digest("hex");
                var md = crypto.createHash("md5");
                md.update(newpwd);
                newpwd = md.digest("hex");
                if(user.pwd !== oldpwd){
                    proxy.trigger('msg','旧密码不正确');
                    return; 
                } 
                tuerBase.updateById(uid,{
                    $set:{
                        pwd:newpwd
                    }
                },'users',function(err,ret){
                    if(err){
                        proxy.trigger('msg',err);
                    } else{
                        proxy.trigger('msg',successmsg);
                    }
                });
            }
        });
    }else{
        res.redirect('/');    
    }
};
