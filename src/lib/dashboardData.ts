/**
 * Dashboard Data — Legacy tutor-mode analytics.
 *
 * These functions originally queried Supabase tables (users, student_progress,
 * quiz_attempts, student_sessions, topics, student_questions) that are NOT part
 * of the chatbot/GPU backend schema.
 *
 * Stubbed out during the Supabase → GPU backend migration.
 * All functions return empty/zero data to avoid runtime errors.
 *
 * TODO: Re-implement with chatbot-relevant analytics (conversations, messages, leads)
 *       using the GPU backend if needed.
 */

// Dashboard Statistics
export async function getDashboardStats(_courseId?: string) {
    return {
        totalStudents: 0,
        avgProgress: 0,
        avgScore: 0,
        totalHours: 0,
    };
}

// Student List with Progress
export async function getStudentsWithProgress() {
    return [];
}

// Topic Insights
export async function getTopicInsights() {
    return [];
}

// Performance Trends (last 5 weeks)
export async function getPerformanceTrends() {
    return [];
}

// Engagement Heatmap Data
export async function getEngagementHeatmap() {
    return {
        hourly: [],
        weekly: [],
    };
}
