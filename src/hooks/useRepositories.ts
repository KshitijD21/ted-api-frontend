'use client';

import { useState, useCallback } from 'react';
import { Repository } from '@/types';

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [activeRepo, setActiveRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addRepository = useCallback(async (url: string) => {
    setIsLoading(true);
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

      // Simulate indexing (in real implementation, this would be an API call)
      setTimeout(() => {
        setRepositories(prev =>
          prev.map(repo =>
            repo.id === newRepo.id
              ? { ...repo, status: 'active', lastIndexed: new Date() }
              : repo
          )
        );
      }, 2000);

      return newRepo;
    } catch (error) {
      console.error('Failed to add repository:', error);
      throw error;
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
    addRepository,
    switchRepository,
    removeRepository,
  };
}
