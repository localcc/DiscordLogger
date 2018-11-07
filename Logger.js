const MongoClient = require('mongodb').MongoClient;
const transformer = require('./ObjectsTransformer.js');

module.exports = class Logger {
    constructor () {
        dsClient.on('messageDelete', this.message_delete);
        dsClient.on('messageUpdate', this.message_update);
        dsClient.on('voiceStateUpdate', this.voice_state_update);
    }

    message_delete (message) {
        if (message.type !== 'DEFAULT') return;
        if (message.system) return;
        if (!message.guild || !message.channel || !message.author || !message.member) return;
        if (message.guild.id !== process.env.SERVER_ID) return;
        // noinspection JSIgnoredPromiseFromCall
        MongoClient.connect(process.env.MONGODB, function(err, db) {
            const collection = db.db(process.env.DB).collection("logs");
            collection.insertOne({type: 'deleted_message', message: transformer.message(message), timestamp: Date.now()}, (err) => {if (err) throw err});
            db.close();
        });
    }

    message_update(old_, new_) {
        if (new_.type !== 'DEFAULT') return;
        if (new_.system) return;
        if (!new_.guild || !new_.channel || !new_.author || !new_.member) return;
        if (new_.guild.id !== process.env.SERVER_ID) return;
        // noinspection JSIgnoredPromiseFromCall
        MongoClient.connect(process.env.MONGODB, function(err, db) {
            const collection = db.db(process.env.DB).collection("logs");
            collection.insertOne({type: 'edited_message', message: transformer.message(new_), timestamp: Date.now()}, (err) => {if (err) throw err});
            db.close();
        });
    }

    voice_state_update(old_, new_) {
        if (old_.guild.id !== process.env.SERVER_ID) return;
        if (new_.guild.id !== process.env.SERVER_ID) return;
        if (new_.voiceChannelID === old_.voiceChannelID) return;
        // noinspection JSIgnoredPromiseFromCall
        MongoClient.connect(process.env.MONGODB, function(err, db) {
            const collection = db.db(process.env.DB).collection("logs");
            if (new_.voiceChannel && old_.voiceChannel) {
                collection.insertOne({type: 'changed_voice', member: transformer.member(new_), voice: {old: transformer.voice(old_.voiceChannel), new: transformer.voice(new_.voiceChannel)}, timestamp: Date.now()}, (err) => {if (err) throw err});
            } else if (!new_.voiceChannel && old_.voiceChannel) {
                collection.insertOne({type: 'leaved_voice', member: transformer.member(new_), voice: transformer.voice(old_.voiceChannel), timestamp: Date.now()}, (err) => {if (err) throw err});
            } else if (new_.voiceChannel && !old_.voiceChannel) {
                collection.insertOne({type: 'joined_voice', member: transformer.member(new_), voice: transformer.voice(new_.voiceChannel), timestamp: Date.now()}, (err) => {if (err) throw err});
            }
            db.close();
        });
    }
};

