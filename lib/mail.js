/**
 * send mail class
 */

var nodemailer = require('nodemailer'),
util = require('../lib/util.js');

var transport = nodemailer.createTransport('Sendmail','/usr/sbin/sendmail');

exports.send_mail = function(options, callback) {
	var _conf = {
		sender: 'root@tuer.me',
        headers:{
        }
	};
    util.mix(_conf,options);
	transport.sendMail(_conf, function(err, success) {
		if (err) callback(err);
		else callback(null,success);
	});
};

