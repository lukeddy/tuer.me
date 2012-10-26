var config = require('../lib/config');
var index = function(req,res){
    
    req.session.title = '兔耳帮助';
	req.session.template = 'help';

    res.render('custom/help',{
        config:config,
        session:req.session
    });
};

exports.index = index;
