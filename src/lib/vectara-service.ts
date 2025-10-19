/**
 * Vectara RAG Service - Direct port from Python
 * Handles document search and context building
 */

export interface VectaraSearchResult {
  text: string;
  score: number;
  metadata: Record<string, any>;
  document_id: string;
}

export class VectaraRAGService {
  private customerID: string;
  private corpusID: string;
  private apiKey: string;
  private baseURL = 'https://api.vectara.io/v1/query';

  constructor(customerID: string, corpusID: string, apiKey: string) {
    this.customerID = customerID;
    this.corpusID = corpusID;
    this.apiKey = apiKey;
  }

  /**
   * Search Vectara for relevant documents
   * Same as Python's search() method
   */
  async search(query: string, numResults: number = 3): Promise<VectaraSearchResult[]> {
    console.log('🔍 Searching Vectara for:', query);
    console.log('📋 Configuration:', {
      customerID: this.customerID,
      corpusID: this.corpusID,
      apiKeyLength: this.apiKey?.length,
      numResults
    });

    const payload = {
      query: [
        {
          query: query,
          num_results: numResults,
          corpus_key: [
            {
              customer_id: this.customerID,
              corpus_id: this.corpusID
            }
          ]
        }
      ]
    };

    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`Vectara API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Raw API response:', JSON.stringify(data, null, 2));

      const results = this.parseSearchResults(data);

      console.log(`✅ Found ${results.length} relevant documents`);
      if (results.length > 0) {
        console.log('📄 First result preview:', {
          text: results[0].text.substring(0, 100) + '...',
          score: results[0].score
        });
      } else {
        console.warn('⚠️ No results returned. Corpus might be empty or query has no matches.');
      }

      return results;

    } catch (error) {
      console.error('❌ Vectara search error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      return [];
    }
  }

  /**
   * Parse Vectara response - Same as Python's _parse_search_results()
   */
  private parseSearchResults(response: any): VectaraSearchResult[] {
    const results: VectaraSearchResult[] = [];

    if (response.responseSet && response.responseSet.length > 0) {
      const responseSet = response.responseSet[0];
      if (responseSet.response) {
        for (const result of responseSet.response) {
          results.push({
            text: result.text || '',
            score: result.score || 0,
            metadata: result.metadata || {},
            document_id: result.documentIndex?.toString() || ''
          });
        }
      }
    }

    return results;
  }

  /**
   * Build enhanced prompt with context - Same as Python's build_context_prompt()
   */
  buildContextPrompt(
    query: string,
    retrievedDocs: VectaraSearchResult[],
    maxLength: number = 100
  ): string {
    if (retrievedDocs.length === 0) {
      return `${query}\n\nPlease keep your response under ${maxLength} words and be concise.`;
    }

    let context = 'Based on the following information:\n\n';

    retrievedDocs.forEach((doc, index) => {
      context += `Source ${index + 1} (Score: ${doc.score.toFixed(3)}):\n${doc.text}\n\n`;
    });

    context += `Please answer this question: ${query}\n\n`;
    context += `IMPORTANT: Keep your response under ${maxLength} words and be concise. `;
    context += 'If the information above doesn\'t contain enough details to answer the question, ';
    context += 'please say so briefly and provide what you can based on your general knowledge.';

    return context;
  }

  /**
   * Display retrieved context - Same as Python's get_context_summary()
   */
  getContextSummary(retrievedDocs: VectaraSearchResult[]): string {
    if (retrievedDocs.length === 0) {
      return 'No relevant context found.';
    }

    let summary = `Retrieved ${retrievedDocs.length} relevant documents:\n`;
    retrievedDocs.forEach((doc, index) => {
      const preview = doc.text.substring(0, 100);
      summary += `  ${index + 1}. Score: ${doc.score.toFixed(3)} - ${preview}...\n`;
    });

    return summary;
  }
}
