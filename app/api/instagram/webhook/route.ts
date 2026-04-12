import { NextRequest, NextResponse } from 'next/server';

// Your verify token - must match what you entered in Meta Developer Dashboard
const VERIFY_TOKEN = 'agentforja_instagram_2026';

// GPU Backend URL for processing DMs
const GPU_BACKEND_URL = process.env.GPU_BACKEND_URL || 'http://69.19.137.175:8000';
const GPU_API_KEY = process.env.GPU_API_KEY || '';

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
        // Handle Instagram "changes" format (Instagram Messaging API)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value?.message?.text) {
              const senderId = change.value.sender?.id;
              const messageText = change.value.message.text;

              if (!senderId || change.value.message?.is_echo) {
                console.log('⏭️ Skipping echo or invalid message');
                continue;
              }

              console.log(`📨 New DM from ${senderId}: ${messageText}`);

              forwardToGPU(senderId, messageText).catch(err => {
                console.error('❌ GPU forwarding error:', err);
              });
            }
          }
        }

        // Handle "messaging" format (fallback)
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message?.is_echo) {
              console.log('⏭️ Skipping echo message');
              continue;
            }

            if (!event.message?.text) {
              console.log('⏭️ Skipping non-text message');
              continue;
            }

            const senderId = event.sender.id;
            const messageText = event.message.text;

            console.log(`📨 New DM from ${senderId}: ${messageText}`);

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
        ...(GPU_API_KEY ? { 'X-API-Key': GPU_API_KEY } : {}),
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
