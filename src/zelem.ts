import { RTMClient } from "@slack/rtm-api";
import { WebClient, WebAPICallResult } from '@slack/web-api';
import { MessageEvent } from './MessageEvent';

const token = "xoxb-201130141489-710938159106-K7vmCjAh1rxysbTXC3iyYu78";

export class Zelem {
    private wc = new WebClient(token);
    private rtm = new RTMClient(token);
    private channelsById = new Map<string, string>();
    private idsByChannel = new Map<string, string>();

    private currentQuestion: string = undefined;
    private currentMessage: string = undefined;

    async start(): Promise<WebAPICallResult> {
        const { channels } = await this.wc.channels.list();

        (channels as any[]).forEach(channel => {
            this.channelsById.set(channel.id, channel.name);
            this.idsByChannel.set(channel.name, channel.id);
        });

        this.rtm.on('message', (message: MessageEvent) => {
            this.handleMessage(message);
        });

        return this.rtm.start();
    }

    private async handleMessage(message: MessageEvent): Promise<void> {
        if (this.messageIsFromABot(message)) {
            return;
        }

        if (this.messageIsComplete(message)) {
            const channel = this.idsByChannel.get('weegee');

            await this.wc.chat.postMessage({
                text: `${this.currentQuestion}\n${this.currentMessage}`,
                channel: channel
            });

            this.currentMessage = undefined;
            this.currentMessage = undefined;

            return;
        }

        if (this.messageIsDivine(message)) {
            if (this.messageIsInProgress()) {
                this.currentMessage = this.currentMessage.concat(message.text.toUpperCase());
                console.log(this.currentMessage);
            }

            return;
        }

        if (this.messageIsACallForWisdom(message)) {
            if (this.messageIsInProgress()) {
                return;
            }

            const channel = this.idsByChannel.get('weegee');
            const letter = String.fromCharCode(65+Math.floor(Math.random() * 26));

            this.currentQuestion = message.text;
            this.currentMessage = letter;

            await this.wc.chat.postMessage({
                text: message.text,
                channel: channel
            });

            await this.wc.chat.postMessage({
                text: letter,
                channel: channel
            });

            return;
        }
    }

    private messageIsFromABot(message: MessageEvent) {
        return message.subtype === 'bot_message';
    }

    private messageIsACallForWisdom(message: MessageEvent) {
        return typeof this.channelsById.get(message.channel) === 'undefined' &&
            message.text.endsWith('?');
    }

    private messageIsDivine(message: MessageEvent): boolean {
        return this.channelsById.get(message.channel) == 'weegee' &&
            message.text.length === 1;
    }

    private messageIsInProgress(): boolean {
        return typeof this.currentMessage !== 'undefined' &&
            this.currentMessage.length > 0;
    }

    private messageIsComplete(message: MessageEvent): boolean {
        return this.messageIsInProgress() &&
            message.text.toLowerCase() == 'goodbye';
    }
}
