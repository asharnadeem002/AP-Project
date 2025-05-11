import React, { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '../../../../app/components/dashboard/DashboardLayout';
import { useRouter } from 'next/router';
import { Button } from '../../../../app/components/shared/Button';
import useSWR from 'swr';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fetch function for SWR with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch blog posts');
  }
  
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Invalid data format received from server');
  }
  return data;
};

export default function AdminBlogPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Use CSR with SWR for real-time updates
  const { data: posts, error, mutate } = useSWR<BlogPost[]>('/api/admin/blog', fetcher, {
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  const handleCreatePost = () => {
    router.push('/dashboard/admin/blog/create');
  };

  const handleEditPost = (slug: string) => {
    router.push(`/dashboard/admin/blog/edit/${slug}`);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      mutate();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !currentStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update post status');
      }
      mutate();
    } catch (error) {
      console.error('Error toggling post status:', error);
      alert('Failed to update post status. Please try again.');
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error.message || 'Error loading blog posts. Please try again later.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const safePostsArray = Array.isArray(posts) ? posts : [];
  const filteredPosts = safePostsArray.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Blog Management | Admin Dashboard</title>
      </Head>

      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
              <p className="mt-2 text-sm text-gray-700">
                Create, edit, and manage your blog posts
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={handleCreatePost}
                className="inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create New Post
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts by title..."
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {!posts ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading blog posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="mt-4 text-gray-600">
                  {searchQuery ? 'No matching posts found.' : 'No blog posts yet. Create your first post!'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreatePost} className="mt-4">
                    Create First Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title & Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {post.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              post.published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(post.updatedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleTogglePublish(post.id, post.published)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                post.published
                                  ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                            >
                              {post.published ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleEditPost(post.slug)}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 