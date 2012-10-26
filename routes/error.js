var config = require('../lib/config');
exports.notFound = function(req,res){
    req.session.title = '没有找到你想要的页面';
    req.session.template = '404';
    res.render('custom/404',{
        config:config,
        session:req.session
    });
};

exports.proError = function(req,res){
    req.session.title = '服务器开小差了!';
    req.session.template = '500';
    res.render('custom/500',{
        config:config,
        session:req.session
    });
};
