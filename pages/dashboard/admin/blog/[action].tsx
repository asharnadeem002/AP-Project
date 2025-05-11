import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '../../../../app/components/dashboard/DashboardLayout';
import { Button } from '../../../../app/components/shared/Button';
import { GetServerSideProps } from 'next';

interface BlogPost {
  id?: string;
  title: string;
  description: string;
  content: string;
  slug: string;
  published: boolean;
}

interface Props {
  post?: BlogPost;
  action: 'create' | 'edit';
}

// Server-side props to handle edit mode
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const action = params?.action as string;
  
  if (action !== 'create' && action !== 'edit') {
    return {
      notFound: true,
    };
  }

  // For edit mode, fetch the post data
  if (action === 'edit') {
    const slug = params?.slug as string;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/blog/${slug}`);
      const post = await response.json();
      
      return {
        props: {
          post,
          action,
        },
      };
    } catch {
      return {
        notFound: true,
      };
    }
  }

  return {
    props: {
      action,
    },
  };
};

export default function BlogPostForm({ post: initialPost, action }: Props) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost>({
    title: '',
    description: '',
    content: '',
    slug: '',
    published: false,
    ...initialPost,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setPost((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = action === 'create' ? '/api/admin/blog' : `/api/admin/blog/${post.id}`;
      const method = action === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        throw new Error('Failed to save the post');
      }

      router.push('/dashboard/admin/blog');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`${action === 'create' ? 'Create New Post' : 'Edit Post'} | Admin Dashboard`}</title>
      </Head>

      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">
                {action === 'create' ? 'Create New Post' : 'Edit Post'}
              </h1>
              <Button onClick={() => router.back()}>Cancel</Button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={post.title}
                  onChange={handleTitleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={post.slug}
                  onChange={(e) => setPost({ ...post, slug: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={post.description}
                  onChange={(e) => setPost({ ...post, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={post.content}
                  onChange={(e) => setPost({ ...post, content: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono"
                  rows={15}
                  required
                  placeholder="Write your blog post content here..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={post.published}
                  onChange={(e) => setPost({ ...post, published: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Publish immediately</label>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Saving...' : 'Save Post'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 