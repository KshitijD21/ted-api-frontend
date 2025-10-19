import { GoogleGenAI, Modality } from '@google/genai';

// Simple test function to verify API key and basic connectivity
export async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey });

    // Test basic API connection first
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: 'Hello, can you respond with just "Connection successful"?',
    });

    if (response.text) {
      console.log('Basic API test response:', response.text);
      return { success: true };
    } else {
      return { success: false, error: 'No response received' };
    }
  } catch (error) {
    console.error('Basic API test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Test Live API connection
export async function testLiveConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1alpha'
    });

    console.log('Testing Live API connection...');

    // Test Live API connection
    const session = await ai.live.connect({
      model: 'gemini-2.0-flash-live-001',
      config: {
        responseModalities: [Modality.TEXT] // Start with text only for testing
      },
      callbacks: {
        onopen: () => {
          console.log('Live API connection opened');
        },
        onmessage: (message: unknown) => {
          console.log('Live API message:', message);
        },
        onerror: (error: unknown) => {
          console.error('Live API error:', error);
        },
        onclose: () => {
          console.log('Live API connection closed');
        }
      }
    });

    // Test sending a simple message
    session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{ text: 'Hello' }]
      }],
      turnComplete: true
    });

    // Close after a short delay
    setTimeout(() => {
      session.close();
    }, 5000);

    return { success: true };
  } catch (error) {
    console.error('Live API test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
