/**
 * page:reg.js
 */
define(function(require,exports,module){
    
    $('#J_email').validate({
        expression: "if (VAL.match(/^[^\\W][a-zA-Z0-9\\_\\-\\.]+([a-zA-Z0-9\\_\\-\\.]+)*\\@[a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+)*\\.[a-zA-Z]{2,4}$/)) return true; else return false;",
        message: "email地址貌似有点问题啊亲"
    });

    $('#J_nick').validate({
        expression: "if (VAL && VAL.length<10) return true; else return false;",
        message: "昵称别写太多，十个字符就够啦..."
    });
});
