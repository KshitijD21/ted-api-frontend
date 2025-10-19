"use client";

import { useState } from "react";
import { VectaraRAGService } from "@/lib/vectara-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function VectaraTestPage() {
  const [query, setQuery] = useState("What is machine learning?");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("");

  const testVectaraConnection = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    setRawResponse("");
    setConnectionStatus("Testing connection...");

    try {
      // Check environment variables
      const customerId = process.env.NEXT_PUBLIC_VECTARA_CUSTOMER_ID;
      const corpusId = process.env.NEXT_PUBLIC_VECTARA_CORPUS_ID;
      const apiKey = process.env.NEXT_PUBLIC_VECTARA_API_KEY;

      console.log("🔍 Environment Variables:");
      console.log("Customer ID:", customerId);
      console.log("Corpus ID:", corpusId);
      console.log(
        "API Key:",
        apiKey ? apiKey.substring(0, 20) + "..." : "NOT SET"
      );

      if (!customerId || !corpusId || !apiKey) {
        throw new Error(
          "Vectara credentials not configured in environment variables"
        );
      }

      setConnectionStatus(`✅ Credentials found. Testing search...`);

      // Initialize Vectara service
      const vectara = new VectaraRAGService(customerId, corpusId, apiKey);

      // Perform search
      console.log("🔍 Searching for:", query);
      const searchResults = await vectara.search(query, 5);

      console.log("📊 Results:", searchResults);

      if (searchResults.length > 0) {
        setResults(searchResults);
        setConnectionStatus(
          `✅ SUCCESS! Found ${searchResults.length} results`
        );

        // Build context prompt to see what would be sent to Gemini
        const enhancedPrompt = vectara.buildContextPrompt(
          query,
          searchResults,
          100
        );
        setRawResponse(enhancedPrompt);
      } else {
        setConnectionStatus(
          "⚠️ Connected but no results found. Check if corpus has documents."
        );
        setError(
          "No results returned. Your corpus might be empty or the query might not match any documents."
        );
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : String(err));
      setConnectionStatus("❌ Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    setLoading(true);
    setError("");
    setRawResponse("");
    setConnectionStatus("Testing direct API call...");

    try {
      const customerId = process.env.NEXT_PUBLIC_VECTARA_CUSTOMER_ID!;
      const corpusId = process.env.NEXT_PUBLIC_VECTARA_CORPUS_ID!;
      const apiKey = process.env.NEXT_PUBLIC_VECTARA_API_KEY!;

      const payload = {
        query: [
          {
            query: query,
            num_results: 5,
            corpus_key: [
              {
                customer_id: customerId,
                corpus_id: corpusId,
              },
            ],
          },
        ],
      };

      console.log("📤 Sending direct API request:", payload);

      const response = await fetch("https://api.vectara.io/v1/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("📊 Raw response:", data);

      setRawResponse(JSON.stringify(data, null, 2));
      setConnectionStatus(`✅ API call successful! Status: ${response.status}`);

      // Parse results
      if (data.responseSet && data.responseSet[0]?.response) {
        setResults(data.responseSet[0].response);
      }
    } catch (err) {
      console.error("❌ Direct API error:", err);
      setError(err instanceof Error ? err.message : String(err));
      setConnectionStatus("❌ API call failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Vectara Connection Test</h1>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {connectionStatus || "Not tested yet"}
          </p>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>Customer ID:</strong>{" "}
              {process.env.NEXT_PUBLIC_VECTARA_CUSTOMER_ID || "❌ Not set"}
            </p>
            <p>
              <strong>Corpus ID:</strong>{" "}
              {process.env.NEXT_PUBLIC_VECTARA_CORPUS_ID || "❌ Not set"}
            </p>
            <p>
              <strong>API Key:</strong>{" "}
              {process.env.NEXT_PUBLIC_VECTARA_API_KEY
                ? "✅ Set"
                : "❌ Not set"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Query Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query..."
              className="w-full"
            />

            <div className="flex gap-4">
              <Button
                onClick={testVectaraConnection}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "🔄 Testing..." : "🔍 Test with VectaraRAGService"}
              </Button>

              <Button
                onClick={testDirectAPI}
                disabled={loading}
                variant="secondary"
                className="flex-1"
              >
                {loading ? "🔄 Testing..." : "🌐 Test Direct API Call"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-50 p-4 rounded text-sm overflow-auto">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>✅ Search Results ({results.length} found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border p-4 rounded bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">Result {index + 1}</h3>
                    <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                      Score: {result.score?.toFixed(3) || "N/A"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {result.text || "No text available"}
                  </p>
                  {result.metadata && (
                    <div className="text-xs text-gray-500">
                      <strong>Metadata:</strong>{" "}
                      {JSON.stringify(result.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Response Display */}
      {rawResponse && (
        <Card>
          <CardHeader>
            <CardTitle>📄 Raw Response / Enhanced Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {rawResponse}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 What This Test Does</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Checks if environment variables are set correctly</li>
            <li>Attempts to connect to Vectara API</li>
            <li>Performs a search query</li>
            <li>Displays retrieved documents and scores</li>
            <li>Shows what enhanced prompt would be sent to Gemini</li>
          </ol>

          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="font-semibold">💡 Troubleshooting:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>If connection fails: Check API credentials</li>
              <li>If no results: Your corpus might be empty</li>
              <li>Check browser console (F12) for detailed logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
