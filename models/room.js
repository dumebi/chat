var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
    room_id: Schema.Types.String,
    members: Schema.Types.Array,
    history: Schema.Types.Mixed,
    type: Schema.Types.String,
    created_at: {type: Schema.Types.Date, default: Date.now},
    modified_at: {type: Schema.Types.Date, default: Date.now}
});

module.exports = mongoose.model('Room', roomSchema);