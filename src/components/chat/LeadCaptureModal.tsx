"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeadCaptureModalProps {
    isOpen: boolean;
    config: {
        fields: string[];
        requiredFields: string[];
        consentText?: string | null;
        successMessage: string;
        skipAllowed: boolean;
        reason?: string; // Why we're asking (from intent detector)
    };
    chatbotId: string;
    conversationId?: string;
    onSubmit: (lead: LeadData) => void;
    onSkip?: () => void;
    onClose?: () => void;
}

interface LeadData {
    email: string;
    name?: string;
    phone?: string;
    company?: string;
}

export function LeadCaptureModal({
    isOpen,
    config,
    chatbotId,
    conversationId,
    onSubmit,
    onSkip,
    onClose
}: LeadCaptureModalProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        // Validate required fields
        config.requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            }
        });

        // Validate email format
        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        // Submit to API
        try {
            const response = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatbotId,
                    conversationId,
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone,
                    company: formData.company,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitSuccess(true);
                // Call parent success handler
                onSubmit({
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone,
                    company: formData.company,
                });

                // Auto-close after 2 seconds
                setTimeout(() => {
                    onClose?.();
                }, 2000);
            } else {
                setErrors({ submit: data.error || 'Failed to save your information' });
            }
        } catch (error) {
            setErrors({ submit: 'Network error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const fieldLabels: Record<string, string> = {
        email: 'Email address',
        name: 'Your name',
        phone: 'Phone number',
        company: 'Company name',
    };

    const fieldPlaceholders: Record<string, string> = {
        email: 'you@example.com',
        name: 'John Doe',
        phone: '+1 234 567 8900',
        company: 'Your Company Inc.',
    };

    // Success state
    if (submitSuccess) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-5xl">✓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Thanks!
                            </h2>
                            <p className="text-gray-600">
                                {config.successMessage}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={config.skipAllowed ? onSkip : undefined}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">👋</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Let's get started!
                            </h2>
                            <p className="text-gray-600">
                                {config.reason || "Share a few details so we can help you better"}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {config.fields.map(field => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {fieldLabels[field]}
                                        {config.requiredFields.includes(field) && (
                                            <span className="text-red-500 ml-1">*</span>
                                        )}
                                    </label>
                                    <input
                                        type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                                        value={formData[field] || ''}
                                        onChange={(e) => {
                                            setFormData({ ...formData, [field]: e.target.value });
                                            setErrors({ ...errors, [field]: '' });
                                        }}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors[field] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder={fieldPlaceholders[field]}
                                        disabled={isSubmitting}
                                    />
                                    {errors[field] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
                                    )}
                                </div>
                            ))}

                            {config.consentText && (
                                <label className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        required
                                        className="mt-1 rounded border-gray-300"
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-xs text-gray-600">{config.consentText}</span>
                                </label>
                            )}

                            {errors.submit && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm">{errors.submit}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Continue to Chat'}
                                </button>
                                {config.skipAllowed && onSkip && (
                                    <button
                                        type="button"
                                        onClick={onSkip}
                                        disabled={isSubmitting}
                                        className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Skip
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
