import { sql } from '@vercel/postgres';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const auth_key = searchParams.get('auth_key');

    if (auth_key !== process.env.TALLY_AUTH_KEY) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const limit = searchParams.get('limit') || 50;

    const result = await sql`
      SELECT id, mobile, message, status, response, created_at, sent_at
      FROM sms_log
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM sms_log
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;

    return Response.json({
      success: true,
      stats: stats.rows[0],
      logs: result.rows
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
