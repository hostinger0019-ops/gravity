import { NextResponse } from 'next/server';

/**
 * Generate Sample Data — Legacy tutor-mode endpoint.
 *
 * This endpoint originally generated sample students/courses/quizzes via Supabase.
 * It relies on legacy tutor tables (users, courses, topics, enrollments, student_progress,
 * quiz_attempts, student_sessions) that are NOT part of the chatbot/GPU backend schema.
 *
 * Stubbed out during the Supabase → GPU backend migration.
 * TODO: Re-implement if sample data generation is needed for the new schema.
 */

export async function POST(request: Request) {
    return NextResponse.json(
        {
            error: "Sample data generation is not available — legacy tutor tables are not supported by the GPU backend. " +
                "Use the admin dashboard or ai-generator/create to create chatbots instead.",
            legacy: true,
        },
        { status: 501 }
    );
}
