import { NextResponse } from 'next/server';
import { getDashboardStats, getStudentsWithProgress, getTopicInsights, getPerformanceTrends, getEngagementHeatmap } from '../../../src/lib/dashboardData';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        switch (type) {
            case 'stats':
                const stats = await getDashboardStats();
                return NextResponse.json(stats);

            case 'students':
                const students = await getStudentsWithProgress();
                return NextResponse.json(students);

            case 'topics':
                const topics = await getTopicInsights();
                return NextResponse.json(topics);

            case 'trends':
                const trends = await getPerformanceTrends();
                return NextResponse.json(trends);

            case 'heatmap':
                const heatmap = await getEngagementHeatmap();
                return NextResponse.json(heatmap);

            case 'all':
                // Return all data at once for initial load
                const [allStats, allStudents, allTopics, allTrends, allHeatmap] = await Promise.all([
                    getDashboardStats(),
                    getStudentsWithProgress(),
                    getTopicInsights(),
                    getPerformanceTrends(),
                    getEngagementHeatmap()
                ]);

                return NextResponse.json({
                    stats: allStats,
                    students: allStudents,
                    topics: allTopics,
                    trends: allTrends,
                    heatmap: allHeatmap
                });

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
        }
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
