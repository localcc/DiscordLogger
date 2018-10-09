const Discord = require('discord.js');
const client = new Discord.Client();
if (!('TOKEN' in process.env)) {
    console.error('Вы должны указать системную переменную TOKEN');
    process.exit();
}
if (!('SERVER_ID' in process.env)) {
    console.error('Вы должны указать системную переменную SERVER_ID');
    process.exit();
}

process.date = () => {
    return new Date().toUTCString().replace(/^\w+, (\d+ \w+ \d+) (\d\d:\d\d:\d\d) GMT$/gi, '$1 $2');
};

client.on('messageDelete', (message) => {
    if (!message.guild || !message.channel || !message.author || !message.member) return;
    if (message.guild.id !== process.env.SERVER_ID) return;
    console.log(`${process.date()} ${message.author.tag} (${message.author}) удалил сообщение в #${message.channel.name} (${message.channel}): ${message.content}`);
});

client.on('voiceStateUpdate', (old_, new_) => {
    if (old_.guild.id !== process.env.SERVER_ID) return;
    if (new_.guild.id !== process.env.SERVER_ID) return;
    if (new_.voiceChannelID === old_.voiceChannelID) return;
    if (new_.voiceChannel && old_.voiceChannel) {
        console.log(`${process.date()} ${new_.user.tag} (${new_.user}) перешел с голосового канала ${old_.voiceChannel.name} в ${new_.voiceChannel.name}`);
    } else if (!new_.voiceChannel && old_.voiceChannel) {
        console.log(`${process.date()} ${new_.user.tag} (${new_.user}) вышел с голосового канала ${old_.voiceChannel.name}`);
    } else if (new_.voiceChannel && !old_.voiceChannel) {
        console.log(`${process.date()} ${new_.user.tag} (${new_.user}) вошел в голосовой канал ${new_.voiceChannel.name}`);
    }
});

client.login(process.env.TOKEN).catch((e) => {
    console.error(e);
    process.exit(147);
});