var config = require('../lib/config');
var index = function(req,res){

    req.session.title = '关于兔耳';
    req.session.template = 'about';
    
    res.render('custom/about',{
        config:config,
        session:req.session
    });
};

exports.index = index;
