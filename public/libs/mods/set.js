/**
 * page:set
 */

define(function(require, exports, module) {

	$('#J_nick').validate({
		expression: "if (VAL!=='' && VAL && VAL.length<10) return true; else return false;",
		message: "昵称小于10个字节就好啦~"
	});

	$('#J_pwd').validate({
		expression: "if (VAL!=='' && VAL.length > 5 && VAL.length<15 && VAL) return true; else return false;",
		message: "密码至少得大于5位数啦！"
	});

	$('#J_profile').validate({
		expression: "if (VAL.length>30) return false; else return true;",
		message: "签名别多于30个字就好了.."
	});

	$('#J_soleUrl').validate({
		expression: "if (VAL.length<=10 && !(/[^0-9a-z]/g).test(VAL)) return true; else return false;",
		message: "最多10个字符，还不能带特殊标点~"
	});

	window.imgforbase64 = function(str,name) {
		var id = 'J_preview',
        ext = name.substring(name.lastIndexOf('.')+1,name.length),
		img;
		if (!document.getElementById(id)) {
			img = document.createElement('img');
			img.id = id;
			img.src = 'data:image/'+ext+';base64,' + str;
			document.body.appendChild(img);
		} else {
			img = document.getElementById(id);
			img.src = 'data:image/'+ext+';base64,' + str;
		}
        $('#J_avatar').val(img.src);
	};

	swfobject.embedSWF('http://assest.tuer.me/libs/imgforbase64/imgforbase64.swf?v=20120803', 'avatar', 104, 24, '9.0.0', 'http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75', {
		width: 104,
		height: 24,
		outwidth: 150,
		outheight: 150
	},
	{
		loop: false,
		menu: false,
		allowScriptAccess: 'always',
		allowFullScreen: 'false',
		quality: 'best',
		bgcolor: '#fff',
		wmode: 'transparent'
	});


	$('#J_Change_Avatar').click(function() {
		return false;
	});

});

