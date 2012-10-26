/**
 * page:reg.js
 */
define(function(require,exports,module){
    
    $('#J_email').validate({
        expression: "if (VAL.match(/^[^\\W][a-zA-Z0-9\\_\\-\\.]+([a-zA-Z0-9\\_\\-\\.]+)*\\@[a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+)*\\.[a-zA-Z]{2,4}$/)) return true; else return false;",
        message: "email地址貌似有点不对吖亲"
    });
    
    $('#J_pwd').validate({
        expression: "if (VAL.length > 5 && VAL) return true; else return false;",
        message: "密码至少得是五位数吧~"
    });

});
