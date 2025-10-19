"use client";

import React, { useState } from "react";
import {
  testGeminiConnection,
  testLiveConnection,
} from "@/lib/test-connection";

export function VoiceTest() {
  const [status, setStatus] = useState<string>("Ready to test");
  const [basicTestResult, setBasicTestResult] = useState<string>("");
  const [liveTestResult, setLiveTestResult] = useState<string>("");

  const runBasicTest = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setBasicTestResult("❌ No API key found");
      return;
    }

    setBasicTestResult("🔄 Testing basic API...");
    const result = await testGeminiConnection(apiKey);

    if (result.success) {
      setBasicTestResult("✅ Basic API connection works");
    } else {
      setBasicTestResult(`❌ Basic API failed: ${result.error}`);
    }
  };

  const runLiveTest = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setLiveTestResult("❌ No API key found");
      return;
    }

    setLiveTestResult("🔄 Testing Live API...");
    const result = await testLiveConnection(apiKey);

    if (result.success) {
      setLiveTestResult("✅ Live API connection works");
    } else {
      setLiveTestResult(`❌ Live API failed: ${result.error}`);
    }
  };

  const runAllTests = async () => {
    setStatus("Running diagnostics...");
    await runBasicTest();
    await runLiveTest();
    setStatus("Tests completed");
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Gemini API Diagnostics</h3>
      <div className="space-y-3">
        <p>
          Status: <span className="text-blue-600">{status}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={runBasicTest}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Test Basic API
          </button>
          <button
            onClick={runLiveTest}
            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Test Live API
          </button>
          <button
            onClick={runAllTests}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            Run All Tests
          </button>
        </div>

        {basicTestResult && (
          <div className="p-2 bg-gray-100 rounded text-sm">
            Basic API: {basicTestResult}
          </div>
        )}

        {liveTestResult && (
          <div className="p-2 bg-gray-100 rounded text-sm">
            Live API: {liveTestResult}
          </div>
        )}

        <div className="text-xs text-gray-600">
          API Key:{" "}
          {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "✅ Found" : "❌ Missing"}
        </div>
      </div>
    </div>
  );
}
