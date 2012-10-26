/**
 * page:set
 */

define(function(require, exports, module) {

	window.imgforbase64 = function(str, name) {
		var id = 'J_preview',
		ext = name.substring(name.lastIndexOf('.') + 1, name.length),
		img;
		if (!document.getElementById(id)) {
			img = document.createElement('img');
			img.id = id;
			img.src = 'data:image/' + ext + ';base64,' + str;
			document.body.appendChild(img);
		} else {
			img = document.getElementById(id);
			img.src = 'data:image/' + ext + ';base64,' + str;
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

    var jcrop_api, boundx, boundy,ct = 48;

	$('#J_BigPic').Jcrop({
		bgOpactiy: 0.5,
		bgColor: 'white',
		aspectRatio: 1,
        minSize:[ct,ct],
		onChange: updatePreview,
		onSelect: updatePreview
	},
	function() {
		// Use the API to get the real image size
		var bounds = this.getBounds();
		boundx = bounds[0];
		boundy = bounds[1];
		// Store the API in the jcrop_api variable
		jcrop_api = this;
        var v = $('#J_Coordinate').val();
        if(v != 'undefined'){
            v = v.split(',');
            jcrop_api.setSelect([v[2],v[3],v[4],v[5]]);
        }else{
            jcrop_api.setSelect([0,0,48,48]);
        }
	});

	function updatePreview(c) {
		if (parseInt(c.w, 10) > 0) {
			var rx = ct / c.w;
			var ry = ct / c.h;

			$('#J_SmallPic').css({
				width: Math.round(rx * boundx) + 'px',
				height: Math.round(ry * boundy) + 'px',
				marginLeft: '-' + Math.round(rx * c.x) + 'px',
				marginTop: '-' + Math.round(ry * c.y) + 'px'
			});
            
            $('#J_Coordinate').val((function(){
                var data = [],
                    list = ['w','h','x','y','x2','y2'];
                for(var i=0;i<list.length;i++){
                    data.push(Math.round(c[list[i]]));
                }
                return data.join(',');
            })());
		}
	}
    
    $('#avatarSave').submit(function(){
        var action = $(this).attr('action');
        $.ajax({
            url:action,
            data:{
                coordinate:$('#J_Coordinate').val()
            },
            type:'post',
            success:function(code){
                window.location.reload();
            }
        });
        return false;
    });
    
    $('#avatarUpload').submit(function(){
        var action = $(this).attr('action');
        $.ajax({
            url:action,
            data:{
                avatar:$('#J_avatar').val()
            },
            type:'post',
            success:function(code){
                window.location.reload();
            }
        });
        return false;
    });

});

