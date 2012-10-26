/**
 * base.js for model
 */

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var config = require('../lib/config');
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var EventProxy = require('eventproxy').EventProxy;
var util = require('../lib/util');

var tuerBase = function(host, port) {
	this.db = new Db('node-mongo-tuer', new Server(host, port, {
		auto_reconnect: true
	},
	{}));
	this.db.open(function() {});
};

tuerBase.prototype.getCollection = function(collection, callback) {
	this.db.collection(collection, function(err, db) {
		if (err) callback(err);
		else callback(null, db);
	});
};

tuerBase.prototype.findBySlice = function(selector, collection, start, end, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			db.find(selector).sort({
				_id: - 1
			}).skip(start).limit(end - start).toArray(function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.findBy = function(selector, collection, limit, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			db.find(selector).limit(limit).sort({
				_id: - 1
			}).toArray(function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.findAll = function(collection, limit, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			db.find().limit(limit).sort({
				_id: - 1
			}).toArray(function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.findAllDiary = function(limit, callback) {
	this.findDiaryBy({
		privacy: 0
	},
	0, limit, callback);
};

tuerBase.prototype.findCommentSlice = function(id, start, end, callback) {
	var self = this;
	this.getCollection('comment', function(err, db) {
		if (err) calllback(err);
		else {
			var cursor = db.find({
				'related_id': id
			}).sort({
				_id: 1
			}).skip(start).limit(end - start);
			cursor.toArray(function(err, comments) {
				if (err) callback(err);
				else {
					if (comments.length) {
						self.getCollection('users', function(err, dbs) {
							if (err) callback(err);
							else {
								var map = {},
								ids = [];
								comments.forEach(function(comment, index) {
									if (map[comment.userid]) {
										map[comment.userid].push(index);
									} else {
										map[comment.userid] = [index];
										ids.push(comment.userid);
									}
								});
								ids.forEach(function(id, index) {
									ids[index] = db.db.bson_serializer.ObjectID.createFromHexString(id);
								});
								dbs.find({
									_id: {
										$in: ids
									}
								}).toArray(function(err, users) {
									if (err) callback(err);
									else {
										if (users.length) {
											users.forEach(function(user, index) {
												map[user._id].forEach(function(i) {
													comments[i]['userpage'] = !! user['pageurl'] ? user['pageurl'] : user._id;
													comments[i]['nick'] = user['nick'];
													comments[i]['avatar'] = user['avatar'];
													comments[i]['profile'] = user['profile'];
												});
											});
										}
										callback(null, comments);
									}
								});
							}
						});
					} else {
						callback(null, comments);
					}
				}
			});
		}
	});
};

tuerBase.prototype.removeById = function(id, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			db.remove({
				_id: db.db.bson_serializer.ObjectID.createFromHexString(id)
			},
			{
				safe: true
			},
			function(err, numberOfRemovedDocs) {
				if (err) callback(err);
				else callback(null, numberOfRemovedDocs);
			});
		}
	});
};

tuerBase.prototype.removeBy = function(source, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			db.remove(source, {
				safe: true
			},
			function(err, numberOfRemovedDocs) {
				if (err) callback(err);
				else callback(null, numberOfRemovedDocs);
			});
		}
	});
};

tuerBase.prototype.updateById = function(id, data, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			var source;
			try {
				source = {
					_id: db.db.bson_serializer.ObjectID.createFromHexString(id)
				};
			} catch(e) {
				source = {
					'pageurl': id
				};
			}
			db.update(source, data, {
				safe: true
			},
			function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.update = function(source, data, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			db.update(source, data, {
				safe: true
			},
			function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.findOne = function(source, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			db.findOne(source, function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.findUser = function(id, callback) {
	var self = this;
	self.findOne({
		pageurl: id
	},
	'users', function(err, data) {
		if (err) callback(err);
		else {
			if (data) callback(null, data);
			else {
				self.findById(id, 'users', function(err, data) {
					if (err) callback(err);
					else callback(null, data);
				});
			}
		}
	});
};

tuerBase.prototype.findById = function(id, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			var _id;
			if (typeof id == 'string') {
				try {
					_id = db.db.bson_serializer.ObjectID.createFromHexString(id);
				} catch(err) {
					callback(err);
					return;
				}
			} else {
				_id = id;
			}
			db.findOne({
				_id: _id
			},
			function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.findFollows = function(userid, limit, callback) {
	var self = this;
	this.getCollection('users', function(err, db) {
		if (err) callback(err);
		else {
			db.find({
				'firends': {
					'$in': [db.db.bson_serializer.ObjectID.createFromHexString(userid.toString())]
				}
			}).toArray(function(err, list) {
				if (err) callback(err);
				else callback(null, list.slice(0, limit), list.length);
			});
		}
	});
};

tuerBase.prototype.save = function(data, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			data['created_at'] = new Date();
			db.insert(data, function(err, data) {
				if (err) callback(err);
				else callback(null, data);
			});
		}
	});
};

tuerBase.prototype.getNotesCount = function(notebooks, callback) {
	var self = this;
	var proxy = new EventProxy(),
	finish = function() {
		for (var i in arguments) {
			notebooks[i]['size'] = arguments[i];
		}
		callback(null, notebooks);
	},
	arg = [];

	if (notebooks.length) {

		notebooks.forEach(function(book, index) {
			arg.push(index.toString());
		});
		arg.push(finish);
		proxy.assign.apply(proxy, arg);
		notebooks.forEach(function(book, index) {
			self.getCount({
				notebook: book._id.toString()
			},
			'diary', function(err, count) {
				if (err) callback(err);
				else {
					proxy.trigger(index.toString(), count);
				}
			});
		});
	} else {
		callback(null, notebooks);
	}
};

tuerBase.prototype.getCount = function(source, collection, callback) {
	var self = this;
	this.getCollection(collection, function(err, db) {
		if (err) callback(err);
		else {
			var cursor = db.find(source);
			cursor.count(function(err, count) {
				if (err) callback(err);
				else callback(null, count);
			});
		}
	});
};

tuerBase.prototype.findDiaryCount = function(id, isSelf, callback) {
	var self = this;
	this.getCollection('diary', function(err, db) {
		if (err) callback(err);
		else {
			var searchdata = {
				userid: id.toString()
			};
			if (!isSelf) searchdata['privacy'] = 0;
			var cursor = db.find(searchdata);
			cursor.count(function(err, count) {
				if (err) callback(err);
				else callback(null, count);
			});
		}
	});
};

tuerBase.prototype.findDiaryByUserId = function(id, isSelf, start, end, callback) {
	var self = this;
	this.findDiaryByUsers([id], isSelf, start, end, callback);
};

tuerBase.prototype.findDiaryByUsers = function(ids, isSelf, start, end, callback) {
	var self = this;
	ids.forEach(function(id, index) {
		ids[index] = id.toString();
	});
	var searchdata = {
		userid: {
			'$in': ids
		}
	};
	if (!isSelf) searchdata['privacy'] = 0;
	self.findDiaryBy(searchdata, start, end, callback);
};

tuerBase.prototype.findDiaryById = function(id, callback) {
	var self = this;
	this.getCollection('diary', function(err, db) {
		if (err) callback(err);
		else {
			try {
				var _id = db.db.bson_serializer.ObjectID.createFromHexString(id);
			} catch(e) {
				callback(e);
				return;
			}
			self.findDiaryBy({
				_id: _id
			},
			0, 1, function(err, diarys) {
				if (err) callback(err);
				else callback(null, diarys[0]);
			});
		}
	});
};

tuerBase.prototype.findDiaryBy = function(source, start, end, callback) {
	var self = this;
	this.getCollection('diary', function(err, db) {
		if (err) callback(err);
		else {
			var cursor = db.find(source);
			cursor.sort({
				_id: - 1
			}).skip(start).limit(end - start);
			cursor.toArray(function(err, diarys) {
				if (err) callback(err);
				else {
					var map = [],
					ids = {};
					diarys.forEach(function(diary, index) {
                        if(diary.weather) diary.weather = config.weather[diary.weather]['value'];
                        if(diary.mood) diary.mood = config.mood[diary.mood]['value'];
						if (ids[diary.userid]) {
							ids[diary.userid].push(index);
						} else {
							ids[diary.userid] = [index];
							map.push(diary.userid);
						}
					});
					self.getCollection('users', function(err, db) {
						if (err) callback(err);
						else {
							map.forEach(function(id, index) {
								map[index] = db.db.bson_serializer.ObjectID.createFromHexString(id);
							});
							db.find({
								_id: {
									$in: map
								}
							}).toArray(function(err, users) {
								if (err) callback(err);
								else {
									users.forEach(function(data, index) {
										ids[data._id].forEach(function(i) {
											diarys[i]['pageurl'] = !! data['pageurl'] ? data['pageurl'] : data._id;
											diarys[i]['created_user'] = data['nick'];
										});
									});
									self.getCollection('notebooks', function(err, db) {
										if (err) callback(err);
										else {
											var bookids = {},
											bookmap = [];
											diarys.forEach(function(diary, index) {
												if (bookids[diary.notebook]) {
													bookids[diary.notebook].push(index);
												} else {
													bookids[diary.notebook] = [index];
													bookmap.push(diary.notebook);
												}
											});
											bookmap.forEach(function(id, index) {
												bookmap[index] = db.db.bson_serializer.ObjectID.createFromHexString(id);
											});
											db.find({
												_id: {
													$in: bookmap
												}
											}).toArray(function(err, notebooks) {
												if (err) callback(err);
												else {
													notebooks.forEach(function(data, index) {
														bookids[data._id].forEach(function(i) {
															diarys[i]['bookname'] = data['name'];
														});
													});
													callback(null, diarys);
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
};

tuerBase.prototype.findDiarySlice = function(start, end, callback) {
	var self = this;
	self.findDiaryBy({
		privacy: 0
	},
	start, end, callback);
};

tuerBase.prototype.addFriendsTips = function(userid, addid) {
	var self = this;
	this.getCollection('tips', function(err, db) {
		if (err) throw err;
		else {
			db.find({
				related_id: userid,
				type: 'friend',
				addid: addid
			}).toArray(function(err, list) {
				if (err) throw err;
				else {
					if (!list.length) {
						self.save({
							related_id: userid,
							type: 'friend',
							addid: addid
						},
						'tips', function(err, ret) {
							if (err) throw err;
						});
					}
				}
			});
		}
	});
};

tuerBase.prototype.addDiaryTips = function(userid, diaryid) {
	var self = this;
	this.save({
		related_id: userid,
		type: 'diary',
		diaryid: diaryid
	},
	'tips', function(err, ret) {
		if (err) throw err;
	});
};

tuerBase.prototype.removeDiaryTips = function(userid, diaryid) {
	var self = this;
	this.getCollection('tips', function(err, db) {
		if (err) throw err;
		else {
			db.find({
				related_id: userid.toString(),
				diaryid: diaryid.toString(),
				type: 'diary'
			}).toArray(function(err, list) {
				if (err) throw err;
				else {
					list.forEach(function(item) {
						db.remove({
							_id: item._id
						});
					});
				}
			});
		}
	});
};

tuerBase.prototype.removeFriendsTips = function(userid, addid) {
	var self = this;
	this.getCollection('tips', function(err, db) {
		if (err) throw err;
		else {
			db.find({
				related_id: userid.toString(),
				addid: addid.toString(),
				type: 'friend'
			}).toArray(function(err, list) {
				if (list.length) {
					list.forEach(function(item) {
						db.remove({
							_id: item._id
						});
					});
				}
			});
		}
	});
};

tuerBase.prototype.findFriendsByUserId = function(userid, callback) {
	var self = this;
	this.getCollection('tips', function(err, db) {
		if (err) callback(err);
		else {
			db.find({
				type: 'friend',
				related_id: userid
			}).toArray(function(err, data) {
				if (err) callback(err);
				else {
					var friendids = [];
					data.forEach(function(item) {
						friendids.push(item.addid);
					});
					friendids = util.ov(friendids);
					friendids.forEach(function(item, index) {
						var id = db.db.bson_serializer.ObjectID.createFromHexString(item);
						friendids[index] = id;
					});
					self.findBy({
						_id: {
							'$in': friendids
						}
					},
					'users', friendids.length, function(err, data) {
						if (err) callback(err);
						else callback(null, data);
					});
				}
			});
		}
	});
};

tuerBase.prototype.findDiaryTipsByUserId = function(userid, callback) {
	var self = this;
	this.getCollection('tips', function(err, db) {
		if (err) callback(err);
		else {
			db.find({
				type: 'diary',
				related_id: userid
			}).toArray(function(err, data) {
				if (err) callback(err);
				else {
					var diaryids = [];
					data.forEach(function(item) {
						diaryids.push(item.diaryid);
					});
					diaryids = util.ov(diaryids);
					diaryids.forEach(function(item, index) {
						var id = db.db.bson_serializer.ObjectID.createFromHexString(item);
						diaryids[index] = id;
					});
					self.findBy({
						_id: {
							'$in': diaryids
						},
						privacy: 0
					},
					'diary', diaryids.length, function(err, data) {
						if (err) callback(err);
						else callback(null, data);
					});
				}
			});
		}
	});
};

tuerBase.prototype.removeFriend = function(userid, removeid, callback) {
	var self = this;
	this.getCollection('users', function(err, db) {
		if (err) callback(err);
		else {
			db.find({
				_id: db.db.bson_serializer.ObjectID.createFromHexString(removeid)
			}).toArray(function(err, user) {
				if (err) callback(err);
				else {
					if (user.length) {
						db.update({
							_id: db.db.bson_serializer.ObjectID.createFromHexString(userid)
						},
						{
							'$pull': {
								'firends': db.db.bson_serializer.ObjectID.createFromHexString(removeid)
							}
						},
						function(err, ret) {
							if (err) callback(err);
							else {
								if (err) callback(err);
								else {
									callback(null, '删除好友成功');
									self.removeFriendsTips(userid, removeid);
								}
							}
						});
					} else {
						callback('用户不存在');
					}
				}
			});
		}
	});
};

tuerBase.prototype.addFriends = function(userid, addid, callback) {
	var self = this;
	this.getCollection('users', function(err, db) {
		if (err) callback(err);
		else {
			db.find({
				_id: db.db.bson_serializer.ObjectID.createFromHexString(addid)
			}).toArray(function(err, user) {
				if (err) callback(err);
				else {
					if (user.length === 1) {
						db.update({
							_id: db.db.bson_serializer.ObjectID.createFromHexString(addid)
						},
						{
							'$addToSet': {
								"firends": db.db.bson_serializer.ObjectID.createFromHexString(userid)
							}
						},
						{
							safe: true
						},
						function(err, ret) {
							if (err) callback(err);
							else {
								callback(null, '添加好友成功');
								self.addFriendsTips(userid, addid);
							}
						});
					} else {
						callback('用户不存在');
					}
				}
			});
		}
	});
};

tuerBase.prototype.updateDiaryCommentCount = function(callback) {
	var self = this;
	this.getCollection('diary', function(err, db) {
		if (err) {
			callback(err);
		} else {
			db.find().toArray(function(err, list) {
				if (err) {
					callback(err);
				} else {
					callback(null, list);
					list.forEach(function(item, index) {
						self.getCount({
							related_id: item._id.toString()
						},
						'comment', function(err, count) {
							self.update({
								_id: item._id
							},
							{
								'$set': {
									commentcount: count
								}
							},
							'diary', function(err, ret) {
								if (err) console.log(err);
								else console.log(ret);
							});
						});
					});
				}
			});
		}
	});
};

module.exports = new tuerBase('127.0.0.1', 10001);

