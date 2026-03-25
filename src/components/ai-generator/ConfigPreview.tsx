"use client";

interface ChatbotConfig {
    name: string;
    greeting: string;
    directive: string;
    starterQuestions: string[];
    theme: string;
    brandColor: string;
    websiteToScrape?: string | null;
    slug: string;
}

interface ConfigPreviewProps {
    config: ChatbotConfig;
    onEdit?: () => void;
    onCreate: () => void;
    isCreating: boolean;
}

export function ConfigPreview({ config, onEdit, onCreate, isCreating }: ConfigPreviewProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-lg font-bold">{config.name}</div>
                        <div className="text-sm text-indigo-100">/{config.slug}</div>
                    </div>
                    <div
                        className="w-10 h-10 rounded-full border-2 border-white/30"
                        style={{ backgroundColor: config.brandColor }}
                    />
                </div>
            </div>

            {/* Config Details */}
            <div className="p-5 space-y-4">
                {/* Greeting */}
                <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Greeting</div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{config.greeting}</div>
                </div>

                {/* Directive */}
                <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Chatbot Personality</div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        {config.directive}
                    </div>
                </div>

                {/* Starter Questions */}
                {config.starterQuestions && config.starterQuestions.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Suggested Questions</div>
                        <div className="flex flex-wrap gap-2">
                            {config.starterQuestions.map((q, i) => (
                                <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                                    {q}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Website */}
                {config.websiteToScrape && (
                    <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Website to Import</div>
                        <div className="text-sm text-blue-600 flex items-center gap-1">
                            🌐 {config.websiteToScrape}
                        </div>
                    </div>
                )}

                {/* Theme & Color */}
                <div className="flex gap-4">
                    <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Theme</div>
                        <div className="text-sm text-gray-700 capitalize">{config.theme}</div>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Color</div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: config.brandColor }}
                            />
                            <span className="text-sm text-gray-700 font-mono">{config.brandColor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                {onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                        Edit Details
                    </button>
                )}
                <button
                    type="button"
                    onClick={onCreate}
                    disabled={isCreating}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all ${isCreating
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg"
                        }`}
                >
                    {isCreating ? "Creating..." : "✨ Create Chatbot"}
                </button>
            </div>
        </div>
    );
}
