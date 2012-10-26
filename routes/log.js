var config = require('../lib/config');
var index = function(req,res){

    req.session.title = 'ChangeLog';
    req.session.template = 'log';
    
    res.render('custom/log',{
        config:config,
        session:req.session
    });
};

exports.index = index;
