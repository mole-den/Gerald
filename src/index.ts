import * as discord from "discord.js";
import * as sapphire from "@sapphire/framework";
import { scheduledTaskManager } from "./taskManager";
import { PrismaClient } from "@prisma/client";
import Time from "@sapphire/time-utilities";
import Bugsnag from "@bugsnag/js";
export const bugsnag = Bugsnag;
if (process.env.BUGSNAG_KEY) bugsnag.start({
	apiKey: process.env.BUGSNAG_KEY,
});

process.on("SIGTERM", async () => {
	console.log("SIGTERM received");
	void bot.destroy();
	process.exit(0);
});
class Gerald extends sapphire.SapphireClient {
	db: PrismaClient;
	constructor() {
		super({
			typing: true,
			caseInsensitiveCommands: true,
			caseInsensitivePrefixes: true,
			fetchPrefix: async (message) => {
				if (!message.guild) return "g";
				try {
					const x = await bot.db.guild.findUnique({
						where: {
							guildId: message.guild?.id
						},
						select: {
							prefix: true
						}
					});
					return x?.prefix ?? "g";
				} catch (error) {
					return "g";
				}

			},
			loadMessageCommandListeners: true,
			intents: new discord.Intents([discord.Intents.FLAGS.GUILDS, discord.Intents.FLAGS.GUILD_MEMBERS, discord.Intents.FLAGS.GUILD_MESSAGES,
				discord.Intents.FLAGS.DIRECT_MESSAGES, discord.Intents.FLAGS.GUILD_BANS, discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
				discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, discord.Intents.FLAGS.GUILD_VOICE_STATES]),
			partials: ["CHANNEL"],
			defaultCooldown: {
				scope: 3,
				limit: 2,
				delay: Time.Time.Second * 3
			}
		});
		this.db = new PrismaClient({
			log: ["info", "warn", "error"],
		});
		sapphire.container.modules = [];
	}
	
	public async start(): Promise<void> {
		console.log("Starting...");
		await this.db.$connect();
		console.log("Connected to database");
		await sleep(1000);
		await super.login(process.env.TOKEN);
		taskScheduler = new scheduledTaskManager();
		const x = await this.db.guild.count();
		const guilds = await this.guilds.fetch();
		if (guilds.size > x) {
			console.log("Guilds:", guilds.size, "Database:", x);
			guilds.each(async (guild) => {
				await this.db.guild.create({
					data: {
						guildId: guild.id,
						joinedTime: new Date()
					}
				});
			});
		}
		await sleep(4000);
		sapphire.container.modules.forEach(m => m.load());
		this.user?.setStatus("dnd");
		console.log("Ready");
	}
	public override destroy(): void {
		bot.db.$disconnect();
		taskScheduler.removeAllListeners();
		super.destroy();
	}

}
export const bot = new Gerald();
export function durationToMS(duration: string): number {
	const timeRegex = /([0-9]+(m($| )|min($| )|mins($| )|minute($| )|minutes($| )|h($| )|hr($| )|hrs($| )|hour($| )|hours($| )|d($| )|day($| )|days($| )|wk($| )|wks($| )|week($| )|weeks($| )|mth($| )|mths($| )|month($| )|months($| )|y($| )|yr($| )|yrs($| )|year($| )|years($| )))+/gmi;
	let durationMS = 0;
	if (duration.length > 30) return NaN;
	const durationArr = duration.match(timeRegex);
	if (!durationArr) return NaN;
	durationArr.forEach((d) => {
		const time = d.match(/[0-9]+/gmi);
		const unit = d.match(/[a-zA-Z]+/gmi);
		if (!time || !unit) return;
		const timeNum = parseInt(time[0]);
		let unitNum = 0;
		switch (unit[0].toLowerCase()) {
		case "m":
		case "min":
		case "mins":
		case "minute":
		case "minutes":
			unitNum = 60000;
			break;
		case "h":
		case "hr":
		case "hrs":
		case "hour":
		case "hours":
			unitNum = 3600000;
			break;
		case "d":
		case "day":
		case "days":
			unitNum = 86400000;
			break;
		case "wk":
		case "wks":
		case "week":
		case "weeks":
			unitNum = 604800000;
			break;
		case "mth":
		case "mths":
		case "month":
		case "months":
			unitNum = 2592000000;
			break;
		case "y":
		case "yr":
		case "yrs":
		case "year":
		case "years":
			unitNum = 31536000000;
			break;
		}
		durationMS += timeNum * unitNum;
	});
	return durationMS;
}
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export function cleanMentions(str: string): string {
	return str.replace(/@everyone/g, "@\u200beveryone").replace(/@here/g, "@\u200bhere");
}


export let taskScheduler: scheduledTaskManager;
export function getRandomArbitrary(min: number, max: number) {
	return Math.round(Math.random() * (max - min) + min);
}

bot.on("messageCommandDenied", ({ context, message: content }: sapphire.UserError, { message }: sapphire.MessageCommandDeniedPayload) => {
	// `context: { silent: true }` should make UserError silent:
	// Use cases for this are for example permissions error when running a hidden command.
	if (Reflect.get(Object(context), "silent")) return;
	message.channel.send({ content, allowedMentions: { users: [message.author.id], roles: [] } });
});

bot.on("guildCreate", async (guild) => {
	const botUser = bot.user?.id;
	if (!botUser) return;
	const user = await guild.members.fetch(botUser);
	if (user.permissions.has(discord.Permissions.FLAGS.ADMINISTRATOR) === false) guild.leave();
	bot.db.guild.create({
		data: {
			guildId: guild.id,
			joinedTime: new Date(),
		},
	});
	guild.channels.fetch().then(async (channels) => {
		channels.each(async (ch) => {
			if (ch.type === "GUILD_TEXT") {
				const c = (await ch.fetch() as discord.TextChannel);
				c.messages.fetch({ limit: 100 });
			}
		});
	});
});
async function deletedMessageHandler(message: discord.Message | discord.PartialMessage, delTime: Date) {
	if (message.partial || message.author.bot || message.guild === null) return;
	await sleep(100);
	const logs = await message.guild.fetchAuditLogs({
		type: 72
	});
	const auditEntry = logs.entries.find(a =>
		a.target.id === message.author.id
		&& a.extra.channel.id === message.channel.id
		&& Date.now() - a.createdTimestamp < 5000
	);
	const entry = auditEntry;
	const executor = (entry && entry.executor) ? entry.executor.tag : "Unknown (Most likely the author or a bot)";
	const attachments: {
		url: string,
		name: string | null
	}[] | null = [];
	message.attachments.each((attachment) => {
		attachments.push({
			url: attachment.url,
			name: attachment.name
		});
	});
	await bot.db.member.createMany({
		data: [{
			userid: message.id,
			guildid: message.guild.id
		}],
		skipDuplicates: true
	});
	await bot.db.deleted_msg.create({
		data: {
			author: message.author.id,
			content: message.content,
			guildId: message.guild.id,
			msgTime: new Date(message.createdAt.getTime()),
			channel: message.channel.id,
			deletedTime: delTime,
			deletedBy: executor,
			msgId: message.id,
			attachments: attachments,
		}

	});
}

bot.on("messageDelete", async (message) => await deletedMessageHandler(message, new Date()));
bot.on("messageDeleteBulk", async (array) => {
	const delTime = new Date();
	await sleep(100);
	array.each(async (message) => {
		await deletedMessageHandler(message, delTime);
	});
});

bot.start();
//zac very cringe
//gustavo cringe
//gerald cringe