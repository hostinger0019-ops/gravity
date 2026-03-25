"use client";

import { industryTemplates, IndustryTemplate } from "@/data/industry-templates";

interface TemplateSelectorProps {
    selectedTemplate: string | null;
    onSelect: (template: IndustryTemplate) => void;
}

export function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Quick Start Templates</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {industryTemplates.map((template) => (
                    <button
                        key={template.id}
                        type="button"
                        onClick={() => onSelect(template)}
                        className={`
              p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${selectedTemplate === template.id
                                ? "border-indigo-500 bg-indigo-50 shadow-md"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                            }
            `}
                    >
                        <div className="text-2xl mb-2">{template.icon}</div>
                        <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
