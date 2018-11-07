const Discord = require('discord.js');
const client = new Discord.Client();
const MongoClient = require('mongodb').MongoClient;
['TOKEN', 'SERVER_ID', 'MONGODB', 'DB'].forEach(arg => {
    if (!(arg in process.env)) {
        console.error('Вы должны указать системную переменную '+arg);
        process.exit();
    }
});
process.date = () => {
    return new Date().toUTCString().replace(/^\w+, (\d+ \w+ \d+) (\d\d:\d\d:\d\d) GMT$/gi, '$1 $2');
};

/**
 * @param message
 * @returns {*}
 */
function normalize_message(message) {
    message = Object.assign( Object.create( Object.getPrototypeOf(message)), message);
    message.channel = message.channel.id;
    delete message.author.lastMessage;
    delete message.author.lastMessageID;
    delete message.member.lastMessage;
    delete message.member.user;
    delete message.member.guild;
    // noinspection JSUnresolvedVariable
    delete message.mentions._client;
    // noinspection JSUnresolvedVariable
    delete message.mentions._guild;
    delete message.nonce;
    delete message.type;
    delete message.pinned;
    delete message.system;
    delete message.hit;
    // noinspection JSUnresolvedVariable
    delete message.deleted;
    // noinspection JSUnresolvedVariable
    message.member = {
        joinedTimestamp: message.member.joinedTimestamp,
        roles: message.member._roles,
        nickname: message.member.nickname,
    };
    let edits = [];
    message._edits.forEach(edit => {
        // noinspection JSUnresolvedVariable
        edit.attachments.map(a => {
            delete a.client;
            delete a.message;
        });
        edits.push({
            content: edit.content,
            embeds: edit.embeds,
            attachments: edit.attachments,
            mentions: {
                everyone: edit.mentions.everyone,
                users: edit.mentions.users,
                roles: edit.mentions.roles,
                channels: edit.mentions._channels
            },
            tts: edit.tts,
            editedTimestamp: edit.editedTimestamp
        })
    });
    message._edits = edits;
    message.attachments.map(a => {
        delete a.client;
        delete a.message;
    });
    message.embeds.map(embed => {
        delete embed.author;
        delete embed.message;
        delete embed.client;
        delete embed.provider;
        if (embed.video) delete embed.video.embed;
        if (embed.thumbnail) delete embed.thumbnail.embed;
        if (embed.image) delete embed.image.embed;
        if (embed.footer) delete embed.footer.embed;
        embed.fields.map(f => delete f.embed)
    });
    return message;
}

function normalize_member(member) {
    member = Object.assign( Object.create( Object.getPrototypeOf(member)), member);
    delete member.guild;
    delete member.user.lastMessage;
    delete member.user.lastMessageID;
    delete member.lastMessage;
    delete member.lastMessageID;
    delete member.joinedTimestamp;
    delete member._roles;
    delete member.serverDeaf;
    delete member.serverMute;
    delete member.selfMute;
    delete member.selfDeaf;
    if (member.voiceSessionID) {
        delete member.voiceSessionID;
        delete member.voiceChannelID;
    }
    delete member.speaking;
    delete member.deleted;
    return member;
}

function normalize_voice(voiceChannel) {
    voiceChannel = Object.assign( Object.create( Object.getPrototypeOf(voiceChannel)), voiceChannel);
    delete voiceChannel.type;
    delete voiceChannel.deleted;
    delete voiceChannel.position;
    if (voiceChannel.parentID) delete voiceChannel.parentID;
    delete voiceChannel.permissionOverwrites;
    delete voiceChannel.bitrate;
    delete voiceChannel.userLimit;
    delete voiceChannel.guild;
    let members = [];
    [...voiceChannel.members.values()].forEach(m => {
        members.push({
            id: m.user.id,
            username: m.user.username,
            discriminator: m.user.discriminator,
            nickname: m.nickname
        });
    });
    voiceChannel.members = members;
    return voiceChannel;
}

client.on('messageDelete', (message) => {
    if (message.type !== 'DEFAULT') return;
    if (message.system) return;
    if (!message.guild || !message.channel || !message.author || !message.member) return;
    if (message.guild.id !== process.env.SERVER_ID) return;
    // noinspection JSIgnoredPromiseFromCall
    MongoClient.connect(process.env.MONGODB, function(err, db) {
        const collection = db.db(process.env.DB).collection("logs");
        // console.log(`${process.date()} ${message.author.tag} (${message.author}) удалил сообщение в #${message.channel.name} (${message.channel}): ${message.content}`);
        collection.insertOne({type: 'deleted_message', message: normalize_message(message), timestamp: Date.now()}, (err) => {if (err) throw err});
        db.close();
    });
});

client.on('messageUpdate', (old_message, new_message) => {
    if (new_message.type !== 'DEFAULT') return;
    if (new_message.system) return;
    if (!new_message.guild || !new_message.channel || !new_message.author || !new_message.member) return;
    if (new_message.guild.id !== process.env.SERVER_ID) return;
    // noinspection JSIgnoredPromiseFromCall
    MongoClient.connect(process.env.MONGODB, function(err, db) {
        const collection = db.db(process.env.DB).collection("logs");
        collection.insertOne({type: 'edited_message', message: normalize_message(new_message), timestamp: Date.now()}, (err) => {if (err) throw err});
        db.close();
    });
});

client.on('voiceStateUpdate', (old_, new_) => {
    if (old_.guild.id !== process.env.SERVER_ID) return;
    if (new_.guild.id !== process.env.SERVER_ID) return;
    if (new_.voiceChannelID === old_.voiceChannelID) return;
    // noinspection JSIgnoredPromiseFromCall
    MongoClient.connect(process.env.MONGODB, function(err, db) {
        const collection = db.db(process.env.DB).collection("logs");
        if (new_.voiceChannel && old_.voiceChannel) {
            // console.log(`${process.date()} ${new_.user.tag} (${new_.user}) перешел с голосового канала ${old_.voiceChannel.name} в ${new_.voiceChannel.name}`);
            collection.insertOne({type: 'changed_voice', member: normalize_member(new_), voice: {old: normalize_voice(old_.voiceChannel), new: normalize_voice(new_.voiceChannel)}, timestamp: Date.now()}, (err) => {if (err) throw err});
        } else if (!new_.voiceChannel && old_.voiceChannel) {
            // console.log(`${process.date()} ${new_.user.tag} (${new_.user}) вышел с голосового канала ${old_.voiceChannel.name}`);
            collection.insertOne({type: 'leaved_voice', member: normalize_member(new_), voice: normalize_voice(old_.voiceChannel), timestamp: Date.now()}, (err) => {if (err) throw err});
        } else if (new_.voiceChannel && !old_.voiceChannel) {
            // console.log(`${process.date()} ${new_.user.tag} (${new_.user}) вошел в голосовой канал ${new_.voiceChannel.name}`);
            collection.insertOne({type: 'joined_voice', member: normalize_member(new_), voice: normalize_voice(new_.voiceChannel), timestamp: Date.now()}, (err) => {if (err) throw err});
        }
        db.close();
    });
});

client.login(process.env.TOKEN).catch((e) => {
    console.error(e);
    process.exit(147);
});