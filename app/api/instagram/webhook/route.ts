import { NextRequest, NextResponse } from 'next/server';

// Your verify token - must match what you entered in Meta Developer Dashboard
const VERIFY_TOKEN = 'agentforja_instagram_2026';

// GET - Webhook verification (Meta sends this to verify your endpoint)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Meta sends a GET request with these params to verify the webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Instagram webhook verified successfully');
    // Must return the challenge as plain text
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('❌ Instagram webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

// POST - Receive incoming messages/events from Instagram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📩 Instagram webhook event received:', JSON.stringify(body, null, 2));

    // Process incoming messages
    if (body.entry) {
      for (const entry of body.entry) {
        // Handle messaging events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message) {
              const senderId = event.sender.id;
              const messageText = event.message.text;
              const timestamp = event.timestamp;

              console.log(`📨 New DM from ${senderId}: ${messageText}`);

              // TODO: Process the message with your AI and send a reply
              // await handleIncomingMessage(senderId, messageText);
            }
          }
        }
      }
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Instagram webhook error:', error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}
