import { NextRequest, NextResponse } from 'next/server';

// Your verify token - must match what you entered in Meta Developer Dashboard
const VERIFY_TOKEN = 'agentforja_instagram_2026';

// GPU Backend URL for processing DMs
const GPU_BACKEND_URL = process.env.GPU_BACKEND_URL || 'http://69.19.137.175:8000';

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
    
    console.log('📩 Instagram webhook event received:', JSON.stringify(body).slice(0, 500));

    // Process incoming messages
    if (body.entry) {
      for (const entry of body.entry) {
        // Handle messaging events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            // Skip echo messages (messages sent by us)
            if (event.message?.is_echo) {
              console.log('⏭️ Skipping echo message');
              continue;
            }

            // Skip non-text messages (images, stickers, etc.)
            if (!event.message?.text) {
              console.log('⏭️ Skipping non-text message');
              continue;
            }

            const senderId = event.sender.id;
            const messageText = event.message.text;

            console.log(`📨 New DM from ${senderId}: ${messageText}`);

            // Forward to GPU backend for AI processing (fire and forget)
            forwardToGPU(senderId, messageText).catch(err => {
              console.error('❌ GPU forwarding error:', err);
            });
          }
        }
      }
    }

    // Always return 200 OK immediately to acknowledge receipt
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Instagram webhook error:', error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}

// Forward message to GPU backend for Claude AI processing
async function forwardToGPU(senderId: string, messageText: string) {
  try {
    const response = await fetch(`${GPU_BACKEND_URL}/api/instagram/dm-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: senderId,
        message_text: messageText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GPU backend error: ${response.status} ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('✅ GPU backend processed DM:', result);
  } catch (error) {
    console.error('❌ Failed to forward to GPU backend:', error);
  }
}
