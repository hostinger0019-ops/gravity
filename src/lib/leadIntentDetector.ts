/**
 * Intent Detection for Lead Capture (GPT-4o-mini compatible)
 * Uses keyword matching instead of expensive AI function calling
 */

interface IntentResult {
    shouldCapture: boolean;
    confidence: number; // 0-100
    reason: string;
    fields: string[];
    trigger_type: 'transactional' | 'download' | 'followup' | 'qualification' | 'none';
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface LeadCaptureConfig {
    enabled: boolean;
    trigger: 'on_start' | 'during_chat' | 'on_exit';
    aggressiveness?: number; // 1-100, default 60
    minMessages?: number; // Default 2
    cooldownSeconds?: number; // Default 60
}

export class LeadIntentDetector {
    // Keyword patterns by intent type
    private static readonly PATTERNS = {
        transactional: {
            keywords: [
                'buy', 'purchase', 'order', 'book', 'schedule', 'reserve',
                'sign up', 'start trial', 'get started', 'i want', 'checkout',
                'place order', 'proceed', 'confirm', 'subscribe'
            ],
            score: 80,
            reason: 'To complete your request',
            fields: ['email', 'name', 'phone'],
        },

        download: {
            keywords: [
                'send me', 'email me', 'send to', 'download', 'get the',
                'share with me', 'forward me', 'give me access', 'i need',
                'can you send', 'share the', 'get access'
            ],
            score: 70,
            reason: 'To send you what you requested',
            fields: ['email'],
        },

        followup: {
            keywords: [
                'notify me', 'let me know', 'remind me', 'update me',
                'contact me', 'reach out', 'follow up', 'get back to me',
                'stay in touch', 'keep me posted'
            ],
            score: 60,
            reason: 'So we can follow up with you',
            fields: ['email'],
        },

        qualification: {
            keywords: [
                'how much', 'price', 'cost', 'pricing', 'quote', 'estimate',
                'demo', 'trial', 'enterprise', 'business plan', 'payment'
            ],
            score: 40,
            reason: 'To provide personalized information',
            fields: ['email', 'name'],
        },
    };

    private static readonly NEGATIVE_PATTERNS = [
        'just looking', 'browsing', 'not sure', 'maybe later',
        'no thanks', 'not interested', 'what is', 'tell me about'
    ];

    /**
     * Analyze a message and determine if we should capture leads
     */
    static detectIntent(
        userMessage: string,
        conversationHistory: Message[],
        config: LeadCaptureConfig,
        lastCaptureAttempt?: Date
    ): IntentResult {
        // Early return if disabled
        if (!config.enabled || config.trigger !== 'during_chat') {
            return {
                shouldCapture: false,
                confidence: 0,
                reason: '',
                fields: [],
                trigger_type: 'none'
            };
        }

        const message = userMessage.toLowerCase().trim();
        const threshold = config.aggressiveness || 60;
        const minMessages = config.minMessages || 2;
        const cooldown = (config.cooldownSeconds || 60) * 1000;

        // Cooldown check - don't ask too frequently
        if (lastCaptureAttempt && Date.now() - lastCaptureAttempt.getTime() < cooldown) {
            return {
                shouldCapture: false,
                confidence: 0,
                reason: 'Cooldown period',
                fields: [],
                trigger_type: 'none'
            };
        }

        // Minimum engagement check
        if (conversationHistory.length < minMessages) {
            return {
                shouldCapture: false,
                confidence: 0,
                reason: 'Not enough engagement',
                fields: [],
                trigger_type: 'none'
            };
        }

        // Check for negative signals first
        const hasNegativeSignal = this.NEGATIVE_PATTERNS.some(pattern =>
            message.includes(pattern)
        );

        if (hasNegativeSignal) {
            return {
                shouldCapture: false,
                confidence: 0,
                reason: 'User not ready',
                fields: [],
                trigger_type: 'none'
            };
        }

        // Score each intent type
        let bestMatch: IntentResult = {
            shouldCapture: false,
            confidence: 0,
            reason: '',
            fields: [],
            trigger_type: 'none'
        };

        for (const [type, config] of Object.entries(this.PATTERNS)) {
            const matchedKeywords = config.keywords.filter(keyword =>
                message.includes(keyword)
            );

            if (matchedKeywords.length > 0) {
                // Calculate score
                let score = config.score;

                // Bonus for multiple keyword matches
                if (matchedKeywords.length > 1) {
                    score += 10;
                }

                // Engagement bonus (up to +15)
                const messageCount = conversationHistory.length;
                if (messageCount >= 5) score += 15;
                else if (messageCount >= 3) score += 8;

                if (score > bestMatch.confidence) {
                    bestMatch = {
                        shouldCapture: score >= threshold,
                        confidence: score,
                        reason: config.reason,
                        fields: config.fields,
                        trigger_type: type as any
                    };
                }
            }
        }

        return bestMatch;
    }

    /**
     * Quick check - does message contain any triggering keywords?
     */
    static hasAnyIntent(message: string): boolean {
        const lowerMessage = message.toLowerCase();
        return Object.values(this.PATTERNS).some(pattern =>
            pattern.keywords.some(keyword => lowerMessage.includes(keyword))
        );
    }
}
