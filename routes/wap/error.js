exports.notFound = function(req,res){
    res.render('wap/common/404',{
        title:'找不到你想要的页面',
        session:req.session
    });
};

exports.proError = function(req,res){
    res.render('wap/common/500',{
        title:'服务器出错啦！',
        session:req.session
    });
};
