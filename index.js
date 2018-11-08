global.Discord = require('discord.js');
global.dsClient = new Discord.Client();
const Logger = require('./Logger.js');

['TOKEN', 'SERVER_ID', 'MONGODB', 'DB', 'ImgurAPI'].forEach(arg => {
    if (!(arg in process.env)) {
        console.error('Вы должны указать системную переменную '+arg);
        process.exit();
    }
});

dsClient.on('ready', () => {
    global.Logger = new Logger();
});

dsClient.login(process.env.TOKEN).catch((e) => {
    console.error(e);
    process.exit(147);
});