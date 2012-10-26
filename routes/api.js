var config = require('../lib/config');

exports.index = function(req,res){
    req.session.title = 'API';
    req.session.template = 'api';
    res.render('api',{
        config:config,
        session:req.session
    });
};
