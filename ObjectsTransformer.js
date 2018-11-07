module.exports = {
    message (message) {
        message = Object.assign( Object.create( Object.getPrototypeOf(message)), message);
        message.channel = message.channel.id;
        delete message.author.lastMessage;
        delete message.author.lastMessageID;
        delete message.member.lastMessage;
        delete message.member.user;
        delete message.member.guild;
        delete message.mentions._client;
        delete message.mentions._guild;
        delete message.nonce;
        delete message.type;
        delete message.pinned;
        delete message.system;
        delete message.hit;
        delete message.deleted;
        message.member = {
            joinedTimestamp: message.member.joinedTimestamp,
            roles: message.member._roles,
            nickname: message.member.nickname,
        };
        let edits = [];
        message._edits.forEach(edit => {
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
    },
    member (member) {
        member = Object.assign(Object.create(Object.getPrototypeOf(member)),member);
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

    },
    voice (voiceChannel) {
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
};