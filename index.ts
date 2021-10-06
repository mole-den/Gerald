import * as discord from "discord.js";
import * as sql from '@databases/sql';
sql.default;
const myIntents = new discord.Intents();
myIntents.add(discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MEMBERS, discord.Intents.FLAGS.GUILD_MESSAGES, 
discord.Intents.FLAGS.DIRECT_MESSAGES, discord.Intents.FLAGS.GUILD_BANS, discord.Intents.FLAGS.GUILD_MESSAGE_TYPING, 
discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, discord.Intents.FLAGS.GUILD_PRESENCES
);


const bot = new discord.Client({ intents: myIntents });

const logmessages = false;


const prefix = "g";
//var doheartbeat = true

//const guildID = '576344535622483968';

const token = 'ODk1MDcyMTkwNDczNTk2OTU4.YVzO7w.BuC56l_6ThVhlokG-l2BapOVLT4'; //the sacred texts!

const blacklist = ['866502219972608010', '884614962763419718', '704647086204780564']

console.log(process.version);

bot.on('ready', () => {
	console.log('Preparing to take over the world...');
	console.log('World domination complete.');
	console.log('ONLINE');
	bot.user!.setPresence({ activities: [{ name: 'you.', type: "WATCHING" }], status: 'dnd' });
	//online or dnd
	//bot.emit('heartbeated');
});


bot.login(token);
//egg




bot.on('message', (message: discord.Message) => {

	if (logmessages === false) return;
	if (message.channel.type === 'DM') return;
	const channel = message.guild!.channels.cache.find(ch => ch.name === 'gerald');


	console.log(`${message.author.tag} said: "${message.content}" in ${message.guild!.name}`);
	if (!channel) return;
	if (message.channel.name === 'gerald') return;
	if (channel.type === 'GUILD_TEXT'){
		(channel as discord.TextChannel).send(`**${message.author.tag}** said: \`${message.content}\` in ${message.guild!.name}`);
	}
});



bot.on('message', (message: discord.Message) => {

	const userID = message.author;
	userID;
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(' ');
	const command = args.shift()?.toLowerCase();

	if (command === `help`) {
		message.channel.send('Hello! I am Gerald. I will enable you to take control of your server by my rules >:)');
	} else if (command === `detect`) {
		// grab the "first" mentioned user from the message
		// this will return a `User` object, just like `message.author`
		const taggedUser = message.mentions.users.first();
		if (taggedUser) {
			message.channel.send(`User detected: ${taggedUser.username} User ID is: ` + taggedUser);
		}

	} else if (command === `t-servertest`) {
		if (message.channel.type !== 'DM') {
			message.channel.send(`This server's name is: ${message.guild!.name}`);
		}
	} else if (command === `setup`) {
		message.channel.send(`Beginning setup but no because zac cant code`);
		//if (err) return console.log(err);
		console.log(`L`);


		//im a gnome


	} else if (command === `die`) {
		message.channel.send(`no u`);
	} else if (command === `cool`) {
		message.channel.send(`You are not as cool as me.`);
	} else if (command === `invite`) {
		message.channel.send(`https://discord.com/oauth2/authorize?client_id=671156130483011605&scope=bot&permissions=8`);
	} else if (command === 'smite') {
		if (message.channel.type !== 'DM') { 
		blacklist.forEach(userID => message.guild!.members.ban(userID, {
			reason: "Blacklisted by Gerald"
		}));
		message.channel.send('Smite thee with thunderbolts!');
		}
	} else if (command === 'uptime') {
		message.channel.send(Math.floor(process.uptime()).toString())
	}
});


bot.on('message', (message: discord.Message) => {
	if (message.content.toLowerCase().includes('hello there')) {
		message.channel.send('General Kenobi!');
	}
});

async function heartbeat() {
	//console.log('Heartbeat sent.');
	await new Promise(r => setTimeout(r, 500));
	bot.emit('heartbeated');
}

//if doheartbeat = true {
setInterval(heartbeat, 5000);
//}

bot.on('heartbeated', () => {
	//console.log(`Heartbeat recived. Logged in as ${bot.user.tag}`);
});