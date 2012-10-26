define(function(require, exports, module) {
	function tips(callback) {
		$.ajax({
			url: '/tips',
			type: 'get',
			dataType: 'json',
			success: function(json) {
				if (!json.error) callback(json.data);
			}
		});
	}
	tips(function(data) {
		if (data.length) {
			var ret = '<h5>提醒:</h5>';
			data.forEach(function(item) {
				if (item.content) {
                    var title = item.content.slice(0,15);
				    ret += '<p class="tips"><a href="/diary/' + item._id + '">"' + title + '" 有了一条关于你的新回复</a></p>';
				} else if (item.nick) {
					ret += '<p class="tips"><a href="/user/profile/' + item._id + '">"' + item.nick + '" 开始关注您了</a></p>';
				}
			});
			$('#J_UserBar').append(ret);
		}
	});
});

