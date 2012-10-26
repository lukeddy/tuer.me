var tuerBase = require('../model/base'),
    Avatar = require('../lib/avatar'),
    util = require('../lib/util'),
    pag = require('../lib/pag').pag,
    escape = require('jade').runtime.escape,
    config = require('../lib/config'),
    EventProxy = require('eventproxy').EventProxy;

var index = function(req,res,next){
    var proxy = new EventProxy(),
        render = function(diaries,usersCount,privacyCount,diariesCount){

            req.session.title = "首页";
            req.session.template = "index";

            diaries.forEach(function(item){
                item.img = util.getpics(150,1,item.filelist);
                item.avatarUrl = Avatar.getUrl(item.userid);
                item.content = item.content.length > 50 ? item.content.slice(0,50)+'...' : item.content;
                util.setTime(item);
            });

            var now = new Date(),
                year = now.getFullYear(),
                month = now.getMonth(),
                Day = now.getDate(),
                head = '<tr><th colspan="7">'+year + '-' + (month + 1) + '-' + Day + ' '+config.countDownTime+'</th></tr>',
                monthHTML = util.monthHTML(year,month,Day,'cur',head);

            res.render('index',{
                config:config,
                session:req.session,
                diaries:diaries,
                pag:new pag({
                    cur:1,
                    space:15,
                    total:diariesCount,
                    url:'/diaries'
                }).init(),
                usersCount:usersCount,
                monthHTML:monthHTML,
                privacyCount:privacyCount,
                diariesCount:diariesCount
            });
        };

    proxy.assign('diaries','usersCount','privacyCount','diariesCount',render);

    tuerBase.findAllDiary(15,function(err,diaries){
        if(err){
            res.redirect('500');
        }else{
            proxy.trigger('diaries',diaries); 
        }
    });

    tuerBase.getCount({},'users',function(err,usersCount){
        if(err){
            res.redirect('500');
        }else {
            proxy.trigger('usersCount',usersCount); 
        }
    });

    tuerBase.getCount({privacy:'1'},'diary',function(err,privacyCount){
        if(err){
            res.redirect('500');
        }else {
            proxy.trigger('privacyCount',privacyCount);
        }
    });

    tuerBase.getCount({privacy:0},'diary',function(err,diariesCount){
        if(err){
            res.redirect('500');
        }else{
            proxy.trigger('diariesCount',diariesCount);
        }
    });

};

exports.index= index;
