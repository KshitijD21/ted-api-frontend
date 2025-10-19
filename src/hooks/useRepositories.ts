'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { Repository } from '@/types';

const API_BASE_URL = 'http://localhost:8200';

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [activeRepo, setActiveRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRepository = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract repo name from URL
      const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
      const name = match ? match[1] : url;

      const newRepo: Repository = {
        id: Date.now().toString(),
        name,
        url,
        status: 'indexing',
      };

      setRepositories(prev => [...prev, newRepo]);

      // If no active repo, set this as active
      if (!activeRepo) {
        setActiveRepo(newRepo);
      }

      // Call the backend API to fetch and process the repository
      console.log('🚀 Calling /fetch-repo endpoint:', url);

      const response = await axios.post(`${API_BASE_URL}/fetch-repo`, {
        repo_url: url,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minute timeout for large repos
      });

      console.log('✅ Repository fetch response:', response.data);

      // Update repository status to active after successful fetch
      setRepositories(prev =>
        prev.map(repo =>
          repo.id === newRepo.id
            ? {
                ...repo,
                status: 'active',
                lastIndexed: new Date(),
                totalFiles: response.data.total_files,
                owner: response.data.owner,
                repoName: response.data.repo,
              }
            : repo
        )
      );

      return newRepo;
    } catch (error) {
      console.error('❌ Failed to add repository:', error);

      // Update repo status to error
      setRepositories(prev =>
        prev.map(repo =>
          repo.id === Date.now().toString()
            ? { ...repo, status: 'error' }
            : repo
        )
      );

      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.detail || error.message || 'Failed to fetch repository';
        setError(errorMsg);
        throw new Error(errorMsg);
      } else {
        setError('An unexpected error occurred');
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeRepo]);

  const switchRepository = useCallback((repoId: string) => {
    const repo = repositories.find(r => r.id === repoId);
    if (repo) {
      setActiveRepo(repo);
    }
  }, [repositories]);

  const removeRepository = useCallback((repoId: string) => {
    setRepositories(prev => prev.filter(r => r.id !== repoId));
    if (activeRepo?.id === repoId) {
      setActiveRepo(repositories.find(r => r.id !== repoId) || null);
    }
  }, [activeRepo, repositories]);

  return {
    repositories,
    activeRepo,
    isLoading,
    error,
    addRepository,
    switchRepository,
    removeRepository,
  };
}
