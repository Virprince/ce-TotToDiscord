"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiscordQueue = createDiscordQueue;
const p_queue_1 = __importDefault(require("p-queue"));
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Crée une queue pour envoyer des messages Discord avec rate limiting
 */
function createDiscordQueue(config) {
    const requestsPerSecond = config.global.discordRateLimit.requestsPerSecond;
    const maxQueueSize = config.global.discordRateLimit.maxQueueSize;
    const queue = new p_queue_1.default({
        interval: 1000,
        intervalCap: requestsPerSecond,
        concurrency: 1
    });
    /**
     * Envoie un message Discord
     */
    async function sendMessage(msg) {
        if (queue.size >= maxQueueSize) {
            if (config.global.discordRateLimit.onQueueFull === 'drop') {
                console.warn(`[DiscordQueue] Queue full (${queue.size}/${maxQueueSize}), dropping message from rule ${msg.ruleId}`);
                return;
            }
        }
        await queue.add(async () => {
            try {
                const payload = {
                    content: msg.message
                };
                if (!msg.allowMentions) {
                    payload.allowed_mentions = {
                        parse: []
                    };
                }
                const response = await (0, node_fetch_1.default)(msg.webhook, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const text = await response.text();
                    console.error(`[DiscordQueue] Failed to send message (${response.status}): ${text}`, `Rule: ${msg.ruleId}, Webhook: ${msg.webhookId}`);
                }
                else {
                    console.log(`[DiscordQueue] Message sent successfully - Rule: ${msg.ruleId}, Webhook: ${msg.webhookId}`);
                }
            }
            catch (error) {
                console.error(`[DiscordQueue] Error sending message:`, error, `Rule: ${msg.ruleId}, Webhook: ${msg.webhookId}`);
            }
        });
    }
    /**
     * Teste un webhook Discord
     */
    async function testWebhook(webhook, message) {
        try {
            const response = await (0, node_fetch_1.default)(webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: message,
                    allowed_mentions: { parse: [] }
                })
            });
            if (!response.ok) {
                const text = await response.text();
                return { success: false, error: `HTTP ${response.status}: ${text}` };
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    /**
     * Obtient les statistiques de la queue
     */
    function getStats() {
        return {
            pending: queue.pending,
            size: queue.size,
            maxSize: maxQueueSize,
            isPaused: queue.isPaused
        };
    }
    /**
     * Vide la queue
     */
    function clear() {
        queue.clear();
    }
    return {
        sendMessage,
        testWebhook,
        getStats,
        clear
    };
}
//# sourceMappingURL=discordQueue.js.map