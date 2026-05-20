import { neon } from '@neondatabase/serverless';

async function getDB() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS sms_log (
      id SERIAL PRIMARY KEY,
      mobile VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      response TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      sent_at TIMESTAMP
    )
  `;
  return sql;
}

async function sendSMS(mobile, message) {
  const API_KEY = process.env.ADNSMS_API_KEY;
  const API_SECRET = process.env.ADNSMS_API_SECRET;
  const url = `https://portal.adnsms.com/api/v1/secure/send-sms?api_key=${API_KEY}&api_secret=${API_SECRET}&message_type=TEXT&mobile=${mobile}&message_body=${encodeURIComponent(message)}&isPromotional=0&request_type=SiNGLE_SMS`;
  const res = await fetch(url);
  return await res.json();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');
    const message = searchParams.get('message');
    const auth_key = searchParams.get('auth_key');

    if (auth_key !== process.env.TALLY_AUTH_KEY) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!mobile || !message) {
      return Response.json({ success: false, error: 'mobile and message required' }, { status: 400 });
    }

    const sql = await getDB();
    const smsResult = await sendSMS(mobile, message);
    const success = smsResult.api_response_message === 'SUCCESS';
    const status = success ? 'sent' : 'failed';

    await sql`
      INSERT INTO sms_log (mobile, message, status, response, sent_at)
      VALUES (${mobile}, ${message}, ${status}, ${JSON.stringify(smsResult)}, NOW())
    `;

    return Response.json({ success, status, sms_uid: smsResult.sms_uid || null, message: smsResult.api_response_message });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, message, auth_key } = body;

    if (auth_key !== process.env.TALLY_AUTH_KEY) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!mobile || !message) {
      return Response.json({ success: false, error: 'mobile and message required' }, { status: 400 });
    }

    const sql = await getDB();
    const smsResult = await sendSMS(mobile, message);
    const success = smsResult.api_response_message === 'SUCCESS';
    const status = success ? 'sent' : 'failed';

    await sql`
      INSERT INTO sms_log (mobile, message, status, response, sent_at)
      VALUES (${mobile}, ${message}, ${status}, ${JSON.stringify(smsResult)}, NOW())
    `;

    return Response.json({ success, status, sms_uid: smsResult.sms_uid || null, message: smsResult.api_response_message });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
