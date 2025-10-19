import { useRef, useCallback } from 'react';
import { VectaraRAGService, VectaraSearchResult } from '@/lib/vectara-service';

interface UseVectaraRAGOptions {
  enabled?: boolean;
  numResults?: number;
  maxResponseWords?: number;
}

interface VectaraEnhancedResult {
  originalQuery: string;
  enhancedPrompt: string;
  retrievedDocs: VectaraSearchResult[];
  hasContext: boolean;
}

/**
 * Hook to integrate Vectara RAG with your existing chat system
 *
 * Usage:
 * const { enhanceQueryWithRAG, isSearching } = useVectaraRAG();
 * const enhanced = await enhanceQueryWithRAG(userQuery);
 * // Send enhanced.enhancedPrompt to your backend/Gemini
 */
export function useVectaraRAG(options: UseVectaraRAGOptions = {}) {
  const {
    enabled = true,
    numResults = 3,
    maxResponseWords = 100
  } = options;

  const vectaraServiceRef = useRef<VectaraRAGService | null>(null);

  // Initialize Vectara service
  const initializeService = useCallback(() => {
    if (vectaraServiceRef.current) {
      return vectaraServiceRef.current;
    }

    const customerId = process.env.NEXT_PUBLIC_VECTARA_CUSTOMER_ID;
    const corpusId = process.env.NEXT_PUBLIC_VECTARA_CORPUS_ID;
    const apiKey = process.env.NEXT_PUBLIC_VECTARA_API_KEY;

    if (!customerId || !corpusId || !apiKey) {
      console.warn('⚠️ Vectara credentials not configured');
      return null;
    }

    vectaraServiceRef.current = new VectaraRAGService(
      customerId,
      corpusId,
      apiKey
    );

    return vectaraServiceRef.current;
  }, []);

  /**
   * Enhance a user query with Vectara RAG context
   */
  const enhanceQueryWithRAG = useCallback(async (
    query: string
  ): Promise<VectaraEnhancedResult> => {
    console.log('🔍 [useVectaraRAG] Enhancing query with RAG:', query);

    // Return original query if RAG is disabled
    if (!enabled) {
      console.log('ℹ️ [useVectaraRAG] RAG is disabled, returning original query');
      return {
        originalQuery: query,
        enhancedPrompt: query,
        retrievedDocs: [],
        hasContext: false
      };
    }

    // Initialize service
    const service = initializeService();
    if (!service) {
      console.warn('⚠️ [useVectaraRAG] Service not initialized, returning original query');
      return {
        originalQuery: query,
        enhancedPrompt: query,
        retrievedDocs: [],
        hasContext: false
      };
    }

    try {
      // Search Vectara
      console.log('🔍 [useVectaraRAG] Searching Vectara...');
      const results = await service.search(query, numResults);

      if (results.length > 0) {
        console.log(`✅ [useVectaraRAG] Found ${results.length} relevant documents`);
        console.log('📄 [useVectaraRAG] Top result:', {
          score: results[0].score,
          text: results[0].text.substring(0, 100) + '...'
        });

        // Build enhanced prompt
        const enhancedPrompt = service.buildContextPrompt(
          query,
          results,
          maxResponseWords
        );

        console.log('✨ [useVectaraRAG] Enhanced prompt created');
        console.log('📏 [useVectaraRAG] Prompt length:', enhancedPrompt.length);

        return {
          originalQuery: query,
          enhancedPrompt,
          retrievedDocs: results,
          hasContext: true
        };
      } else {
        console.log('⚠️ [useVectaraRAG] No results found, using original query');
        return {
          originalQuery: query,
          enhancedPrompt: query,
          retrievedDocs: [],
          hasContext: false
        };
      }
    } catch (error) {
      console.error('❌ [useVectaraRAG] Error enhancing query:', error);
      return {
        originalQuery: query,
        enhancedPrompt: query,
        retrievedDocs: [],
        hasContext: false
      };
    }
  }, [enabled, numResults, maxResponseWords, initializeService]);

  /**
   * Get context summary for display
   */
  const getContextSummary = useCallback((docs: VectaraSearchResult[]): string => {
    const service = initializeService();
    if (!service) return '';
    return service.getContextSummary(docs);
  }, [initializeService]);

  return {
    enhanceQueryWithRAG,
    getContextSummary,
    isEnabled: enabled
  };
}
