define(function(require, exports, module) {
	var StartColor = '4d67d1';
	$('#J_NewColorSelector').ColorPicker({
		color: "#" + StartColor,
		onShow: function(e) {
			$(e).show();
			return false;
		},
		onHide: function(e) {
			$(e).hide();
			return false;
		},
		onChange: function(hsb, hex, rgb) {
			$('#J_NewColorSelector div').css('backgroundColor', '#' + hex);
			$('#J_newBg').val(hex);
		}
	});

	$('#J_updateNote').change(function() {
		var id = $(this).val(),
		color = $('#'+id).val(),
        txt = $(this).find('option[value='+id+']').text();
		if (color == 'undefined') color = StartColor;
        $('#J_editbookname').val(txt);
		$('#J_EditColorSelector div').css('backgroundColor', '#' + color);
		$('#J_editBg').val(color);
        $('#J_EditColorSelector').ColorPickerSetColor('#'+color);    
	});

	$('#J_EditColorSelector').ColorPicker({
		color: "#" + initColor,
		onShow: function(e) {
			$(e).show();
			return false;
		},
		onHide: function(e) {
			$(e).hide();
			return false;
		},
		onChange: function(hsb, hex, rgb) {
			$('#J_EditColorSelector div').css('backgroundColor', '#' + hex);
			$('#J_editBg').val(hex);
		}
	});

	var selecid = $('#J_updateNote').val(),
	initColor = $('#'+selecid).val(),
    txt = $('#J_updateNote').find('option[value='+selecid+']').text();
    if(initColor == 'undefined') initColor = StartColor;
	$('#J_editBg').val(initColor);
    $('#J_editbookname').val(txt);
	$('#J_EditColorSelector div').css('backgroundColor', '#' + initColor);
    $('#J_EditColorSelector').ColorPickerSetColor('#'+initColor);    

});

