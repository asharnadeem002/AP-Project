import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Header } from "../app/components/shared/Header";
import { Button } from "../app/components/shared/Button";
import { GetStaticProps } from "next";
import {
  PhotoIcon,
  StarIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { UrlObject } from "url";

// Price plans data
const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "Basic features for personal use",
    features: [
      "Upload up to 100 photos",
      "Basic gallery features",
      "Mobile access",
      "1 GB storage",
    ],
    cta: "Get Started",
    href: "/signup",
    mostPopular: false,
  },
  {
    name: "Basic",
    price: "$9.99",
    period: "/month",
    description: "Everything in Free, plus more storage and features",
    features: [
      "Upload up to 1,000 photos",
      "Upload videos up to 5 minutes",
      "Advanced organization tools",
      "10 GB storage",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    mostPopular: true,
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "/month",
    description: "Advanced features for professionals",
    features: [
      "Unlimited photo uploads",
      "Upload videos up to 15 minutes",
      "AI-powered organization",
      "100 GB storage",
      "Premium support",
      "Custom domain",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    mostPopular: false,
  },
];

// Use getStaticProps for Static Site Generation with ISR
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pricingPlans,
    },
    // Enable Incremental Static Regeneration with a revalidation period
    revalidate: 60, // seconds
  };
};

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  mostPopular: boolean;
}

export default function HomePage({
  pricingPlans,
}: {
  pricingPlans: PricingPlan[];
}) {
  return (
    <>
      <Head>
        <title>SnapTrace | Store and organize your photos and videos</title>
        <meta
          name="description"
          content="SnapTrace is a platform for storing, organizing, and sharing your photos and videos with advanced features and security."
        />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Store Your Memories Securely
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              SnapTrace helps you organize, store, and share your photos and
              videos with unparalleled security and ease.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="px-8 py-3 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-lg bg-white text-blue-600 border-white hover:bg-blue-50"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover why thousands of users trust SnapTrace for their photo
                and video storage needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <PhotoIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Organization</h3>
                <p className="text-gray-600">
                  Automatically organize your photos and videos by date,
                  location, and even faces.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <StarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Favorites Gallery</h3>
                <p className="text-gray-600">
                  Mark your favorite memories and access them instantly in a
                  dedicated gallery.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Storage</h3>
                <p className="text-gray-600">
                  Your memories are encrypted and stored securely with
                  industry-leading protection.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <CloudArrowUpIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cloud Sync</h3>
                <p className="text-gray-600">
                  Access your photos and videos from any device with seamless
                  cloud synchronization.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mobile Access</h3>
                <p className="text-gray-600">
                  Enjoy the full SnapTrace experience on your smartphone or
                  tablet.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-blue-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m-6 3.75 3 3m0 0 3-3m-3 3V1.5m6 9h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Easy Sharing</h3>
                <p className="text-gray-600">
                  Share your memories with friends and family with just a few
                  clicks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the plan that works best for you. All plans include our
                core features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map(
                (plan: {
                  name: string;
                  mostPopular: boolean;
                  price: string;
                  period: string;
                  description: string;
                  features: string[];
                  href: string | UrlObject;
                  cta: string;
                }) => (
                  <div
                    key={plan.name}
                    className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                      plan.mostPopular ? "ring-2 ring-blue-600" : ""
                    }`}
                  >
                    {plan.mostPopular && (
                      <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                        Most Popular
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.period && (
                          <span className="text-gray-500 ml-1">
                            {plan.period}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-gray-600">{plan.description}</p>

                      <ul className="mt-6 space-y-4">
                        {plan.features.map((feature: string) => (
                          <li key={feature} className="flex items-start">
                            <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8">
                        <Link href={plan.href}>
                          <Button
                            fullWidth
                            variant={plan.mostPopular ? "default" : "outline"}
                          >
                            {plan.cta}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                About SnapTrace
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Started in 2023, SnapTrace was born from the idea that storing
                memories should be simple, secure, and accessible from anywhere.
              </p>
              <p className="text-gray-600 mb-6">
                Our mission is to provide the best platform for organizing and
                preserving your precious memories. With a team of dedicated
                engineers and designers, we&apos;re constantly improving our
                platform to meet the needs of our users.
              </p>
              <p className="text-gray-600">
                SnapTrace is built with the latest technologies to ensure your
                photos and videos are stored securely and can be accessed
                whenever you need them.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of users who trust SnapTrace with their precious
              memories.
            </p>
            <div className="flex justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-blue-50"
                >
                  Create Your Account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-900 text-gray-400">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white text-lg font-bold mb-4">SnapTrace</h3>
                <p className="mb-4">
                  Securely store and organize your photos and videos.
                </p>
                <p>
                  &copy; {new Date().getFullYear()} SnapTrace. All rights
                  reserved.
                </p>
              </div>

              <div>
                <h3 className="text-white text-lg font-bold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#features" className="hover:text-white">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="hover:text-white">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/gallery" className="hover:text-white">
                      Gallery
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white text-lg font-bold mb-4">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-white">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white text-lg font-bold mb-4">Connect</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-white">
                      Twitter
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Facebook
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Instagram
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      LinkedIn
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
