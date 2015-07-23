var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RoomSchema = new Schema({
	roomId: { type: Number, required: true, index: { unique: true } },
	title: { type: String, default: '' },
	members: { type: Number, default: 0 },
	created: { type: Date },
	lastActivity: { type: Date }
});

RoomSchema.methods = {
	addUser: function(){
		this.update({$inc: {members:1}}, {}, function(err){
			if(err){ console.error("Failed to addUser!"); }
		});
	}
};

RoomSchema.pre('save', function(next){
	this.lastActivity = new Date().toISOString();
	next();
});

exports.Room = mongoose.model('Room', RoomSchema);
