define(function(require, exports, module) {

	$('.J_BigImg').live('click', function() {
		var bigimg = $(this).attr('href');
		$(this).attr({
			'class': 'J_BigPreview'
		});
		$(this).find('img').attr('src', bigimg);
		return false;
	});

	$('.J_BigPreview').live('click', function() {
		return false;
	});

	$('.J_addFriend').live('click', function() {
		var target_id = $(this).attr('target_id');
		$.ajax({
			url: '/friend/add',
			dataType: 'json',
			data: {
				addid: target_id
			},
			type: 'POST',
			success: function(json) {
				//console.log(json);
				window.location.reload();
			}
		});
		return false;
	});

	$('.J_removeFriend').live('click', function() {
		var target_id = $(this).attr('target_id');
		$.ajax({
			url: '/friend/remove',
			dataType: 'json',
			data: {
				removeid: target_id
			},
			type: 'POST',
			success: function(json) {
				//console.log(json);
				window.location.reload();
			}
		});
		return false;
	});

	$('.btn-danger[type=submit]').live('click', function() {
		var msg = '是否确认' + $(this).text() + '?';
		if (confirm(msg)) {
			return true;
		} else {
			return false;
		}

	});

});

