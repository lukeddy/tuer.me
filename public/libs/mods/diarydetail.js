define(function(require, exports, module) {
    var replybox = function(replyid,replyname,diaryid){
        return '<form class="form-horizontal reply" method="post" action="/comment/save" id="J_replaybox">'+
                '<textarea class="input" name="content" rows="3"></textarea>'+
                '<div class="reply-btn-box">'+
                '<button class="btn" type="submit">回复</button>'+
                '<button class="btn J_replycencel" type="button">取消</button>'+
                '</div>'+
                '<input type="hidden" name="replyid" value="'+replyid+'">'+
                '<input type="hidden" name="replyname" value="'+replyname+'">'+
                '<input type="hidden" name="diaryid" value="'+diaryid+'">'+
            '</form>';
    };

	$('a.J_reply').live('click', function() {
        $('#J_replaybox').remove();
        var replyid = $(this).attr('data-replyid'),
            replyname = $(this).attr('data-replyname'),
            diaryid = $(this).attr('data-diaryid');
        $(this).parent().append(replybox(replyid,replyname,diaryid));
		return false;
	});
    $('button.J_replycencel').live('click',function(){
        $('#J_replaybox').remove();
        return false;
    });
});

