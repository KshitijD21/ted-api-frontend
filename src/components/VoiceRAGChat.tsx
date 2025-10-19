"use client";

import { useState, useRef, useEffect } from "react";
import { AudioRecorder, AudioPlayer } from "@/lib/audio";
import { GeminiLiveClient } from "@/lib/gemini-client";
import { VectaraRAGService } from "@/lib/vectara-service";
import { SpeechRecognitionService } from "@/lib/speech-recognition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function VoiceRAGChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [retrievedContext, setRetrievedContext] = useState<string[]>([]);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const geminiRef = useRef<GeminiLiveClient | null>(null);
  const vectaraRef = useRef<VectaraRAGService | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionService | null>(null);

  useEffect(() => {
    // Initialize services
    speechRecognitionRef.current = new SpeechRecognitionService();

    // Initialize Vectara with environment variables
    const customerId = process.env.NEXT_PUBLIC_VECTARA_CUSTOMER_ID;
    const corpusId = process.env.NEXT_PUBLIC_VECTARA_CORPUS_ID;
    const apiKey = process.env.NEXT_PUBLIC_VECTARA_API_KEY;

    if (customerId && corpusId && apiKey) {
      vectaraRef.current = new VectaraRAGService(customerId, corpusId, apiKey);
    } else {
      console.warn(
        "⚠️ Vectara credentials not configured. Please add to .env.local"
      );
    }

    playerRef.current = new AudioPlayer();

    return () => {
      recorderRef.current?.stop();
      playerRef.current?.cleanup();
    };
  }, []);

  /**
   * ✅ PYTHON-STYLE FLOW: Connect to Gemini
   */
  const handleConnect = async () => {
    try {
      setStatus("Connecting to Gemini...");

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables"
        );
      }

      geminiRef.current = new GeminiLiveClient(apiKey, {
        onTranscript: (text, isFinal) => {
          console.log("Transcript:", text, "Final:", isFinal);
          if (isFinal) {
            setTranscript(text);
          }
        },
        onAudio: (audioData) => {
          // Play Gemini's response
          playerRef.current?.playBase64Audio(audioData);
        },
        onError: (error) => {
          console.error("Gemini error:", error);
          setStatus(`Error: ${error.message}`);
        },
        onConnected: () => {
          setIsConnected(true);
          setStatus("✅ Connected! Ready to chat with RAG");
        },
        onDisconnected: () => {
          setIsConnected(false);
          setStatus("Disconnected");
        },
      });

      await geminiRef.current.connect();
    } catch (error) {
      console.error("Connection error:", error);
      setStatus(`Failed to connect: ${error}`);
    }
  };

  /**
   * ✅ PYTHON-STYLE FLOW: Start Recording
   */
  const handleStartRecording = async () => {
    if (!geminiRef.current || !isConnected) {
      alert("Please connect to Gemini first");
      return;
    }

    if (!vectaraRef.current) {
      alert("Vectara not configured. Please add credentials to .env.local");
      return;
    }

    try {
      setStatus("🎤 Recording... (speak for 2+ seconds)");
      setIsRecording(true);
      setRetrievedContext([]);
      setTranscript("");

      recorderRef.current = new AudioRecorder();

      await recorderRef.current.start(
        // onData callback (not used in Python-style flow)
        () => {},

        // onSilence callback - THIS IS WHERE THE MAGIC HAPPENS
        async () => {
          console.log("🔇 Silence detected - processing audio");
          setStatus("🔄 Processing...");

          try {
            // Step 1: Get complete audio blob
            const audioBlob = recorderRef.current!.getAudioBlob();
            console.log("📦 Audio blob size:", audioBlob.size, "bytes");

            // Step 2: Transcribe audio locally (like Python)
            setStatus("🎤 Transcribing...");

            let userText: string;
            try {
              userText = await speechRecognitionRef.current!.transcribe(
                audioBlob
              );
            } catch (transcriptionError) {
              console.error("❌ Transcription error:", transcriptionError);
              setStatus("❌ Transcription failed. Trying fallback...");

              // Fallback: Try to get some user input or use a test query
              userText =
                prompt(
                  "Speech recognition failed. Please type your question:"
                ) || "";
            }

            if (!userText || userText.trim().length < 3) {
              setStatus("❌ Transcription failed or too short");
              setIsRecording(false);
              return;
            }

            console.log("📝 User said:", userText);
            setTranscript(userText);

            // Step 3: Search Vectara for context (like Python)
            setStatus("🔍 Searching knowledge base...");
            console.log("🔍 Calling Vectara search with query:", userText);

            const results = await vectaraRef.current!.search(userText, 3);

            console.log("📊 Vectara search completed. Results:", results);

            if (results.length > 0) {
              console.log(
                `✅ Found ${results.length} relevant documents from Vectara`
              );
              console.log("📄 First result:", {
                text: results[0].text.substring(0, 150),
                score: results[0].score,
              });

              setRetrievedContext(
                results.map(
                  (r) =>
                    `Score: ${r.score.toFixed(3)} - ${r.text.substring(
                      0,
                      100
                    )}...`
                )
              );
            } else {
              console.log("⚠️ No relevant documents found in Vectara");
              console.log("ℹ️ Will send query to Gemini without RAG context");
            }

            // Step 4: Build enhanced prompt (like Python)
            const enhancedPrompt = vectaraRef.current!.buildContextPrompt(
              userText,
              results,
              100 // max 100 words
            );

            console.log("📤 Enhanced prompt:");
            console.log("=".repeat(80));
            console.log(enhancedPrompt);
            console.log("=".repeat(80));
            console.log(
              "📏 Prompt length:",
              enhancedPrompt.length,
              "characters"
            );

            // Step 5: Send TEXT to Gemini (like Python)
            setStatus("🤖 Waiting for Gemini response...");
            console.log("📤 Sending enhanced prompt to Gemini...");

            await geminiRef.current!.sendTextInput(enhancedPrompt);

            console.log("✅ Sent to Gemini - waiting for response");
            setStatus("🔊 Playing response...");
            setIsRecording(false);
          } catch (error) {
            console.error("Processing error:", error);
            setStatus(`Error: ${error}`);
            setIsRecording(false);
          }
        }
      );
    } catch (error) {
      console.error("Recording error:", error);
      setStatus(`Failed to start recording: ${error}`);
      setIsRecording(false);
    }
  };

  /**
   * Stop recording
   */
  const handleStopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
    setStatus("Stopped");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Voice RAG Chat with Gemini</h1>

      {/* Connection Status */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Status: {status}</p>
              {isConnected && (
                <Badge variant="default" className="mt-2">
                  ✅ Connected to Gemini Live API
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        {!isConnected ? (
          <Button onClick={handleConnect} size="lg" className="w-full">
            Connect to Gemini
          </Button>
        ) : (
          <>
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                size="lg"
                className="w-full"
                variant="default"
              >
                🎤 Start Recording
              </Button>
            ) : (
              <Button
                onClick={handleStopRecording}
                size="lg"
                className="w-full"
                variant="destructive"
              >
                ⏹️ Stop Recording
              </Button>
            )}
          </>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">You said:</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{transcript}</p>
          </CardContent>
        </Card>
      )}

      {/* Retrieved Context */}
      {retrievedContext.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Retrieved Context:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {retrievedContext.map((context, i) => (
                <li key={i} className="text-sm text-gray-600">
                  {context}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            How it works (Python-style):
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Click &quot;Connect to Gemini&quot;</li>
            <li>Click &quot;Start Recording&quot; and speak for 2+ seconds</li>
            <li>Stop speaking - system waits 1.5s for silence</li>
            <li>Audio is transcribed locally using Web Speech API</li>
            <li>Vectara searches your knowledge base for relevant context</li>
            <li>Enhanced prompt (with context) sent to Gemini as TEXT</li>
            <li>Gemini responds with audio output</li>
          </ol>

          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-sm font-semibold mb-1">
              ⚠️ Configuration Required:
            </p>
            <p className="text-xs text-gray-600">
              Add Vectara credentials to your .env.local file:
              <br />
              • NEXT_PUBLIC_VECTARA_CUSTOMER_ID
              <br />
              • NEXT_PUBLIC_VECTARA_CORPUS_ID
              <br />• NEXT_PUBLIC_VECTARA_API_KEY
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
