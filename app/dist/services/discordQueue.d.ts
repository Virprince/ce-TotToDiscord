import { Config } from '../types';
type DiscordMessage = {
    webhook: string;
    message: string;
    allowMentions: boolean;
    ruleId: string;
    webhookId: string;
};
/**
 * Crée une queue pour envoyer des messages Discord avec rate limiting
 */
export declare function createDiscordQueue(config: Config): {
    sendMessage: (msg: DiscordMessage) => Promise<void>;
    testWebhook: (webhook: string, message: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    getStats: () => {
        pending: number;
        size: number;
        maxSize: number;
        isPaused: boolean;
    };
    clear: () => void;
};
export {};
//# sourceMappingURL=discordQueue.d.ts.map