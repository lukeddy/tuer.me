var config = require("../lib/config"),
    baiduZm = require("../lib/baiduZm").baiduZm;

exports.search = function(req,res){
    var title = decodeURIComponent(req.query.title),
        author = decodeURIComponent(req.query.author);
	res.header('Content-Type', 'application/json');
    if(title && author){
        var Mu = new baiduZm();
        Mu.searchTrack({
            title:title,
            author:author
        },function(err,data){
            if(err || !data.ret || data.type != "mp3"){
		        res.send('{"ret":false}');
            }else{
		        res.send('{"ret":true,"url":"'+data.url+'"}');
            }
        });
    }else{
		res.send('{"ret":false}');
    }
};

exports.check = function(req,res){
    var url = decodeURIComponent(req.query.url);
    console.log(url);
	res.header('Content-Type', 'application/json');
    res.send('{"ret":true}');
};
