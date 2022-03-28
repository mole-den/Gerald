import { prisma, bot, getRandomArbitrary, } from "..";
import { RateLimiterMemory } from "rate-limiter-flexible"
import { Module } from "../commandClass";
import { Message } from "discord.js";
export class Levelling extends Module {
    xpLimit: RateLimiterMemory | undefined
    constructor() {
		super({
            name: "levelling",
            description: "Levelling",
        })
    }

    async handler(message: Message) {
        if (message.author.bot) return
        console.log("a")
        if (!message.guild) return
        let x = await prisma.member_level.findUnique({
            where: {
                memberID_guildID: {
                    memberID: message.author.id,
                    guildID: message.guildId!
                }
            }
        })
        if (!x) x = await prisma.member_level.create({
            data: {
                memberID: message.author.id,
                guildID: message.guildId!,
            }
        })
        let add = getRandomArbitrary(1, 4)
        try {
            this.xpLimit!.consume(`${message.guildId}-${message.author.id}`, add)
        } catch (error) {
            return
        }
        x.xp = x.xp + add
        if (x.xp >= x.nextLevelXp) {
            x.level++
            x.nextLevelXp = Math.round(100 * ((1 + 0.15) ** x.level))
            message.channel.send(``)
        }
        await prisma.member_level.update({
            where: {
                memberID_guildID: {
                    memberID: message.author!.id,
                    guildID: message.guildId!
                },
            },
            data: {
                level: x.level,
                nextLevelXp: x.nextLevelXp,
                xp: x.xp
            }
        })
    }
    async load(): Promise<void> {
        this.xpLimit = new RateLimiterMemory({
            points: 30,
            duration: 60
        })
        bot.on("messageCreate", x => this.handler(x))
    
    }
    async unload(): Promise<void> {
        bot.off("messageCreate", x => this.handler(x))
    }
}