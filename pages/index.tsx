import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { Header } from "../app/components/shared/Header";
import { Button } from "../app/components/shared/Button";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useAuth } from "../app/lib/AuthContext";
import {
  VideoCameraIcon,
  ClockIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Basic features for personal use",
    features: [
      "Upload up to 5 videos per month",
      "Basic facial recognition",
      "Standard clothing detection",
      "Community support",
    ],
    cta: "Get Started",
    href: "/signup",
    mostPopular: false,
  },
  {
    name: "Basic",
    price: "$9.99",
    period: "/month",
    description: "Enhanced features for frequent users",
    features: [
      "Upload up to 20 videos per month",
      "Advanced facial recognition",
      "Detailed clothing attribute detection",
      "Priority support",
      "Access to timestamped screenshots",
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
      "Unlimited video uploads",
      "Real-time video processing",
      "Custom clothing attribute models",
      "Premium support",
      "API access for integration",
      "Detailed analytics and reporting",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    mostPopular: false,
  },
];

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pricingPlans,
    },
    revalidate: 60,
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
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (user.role === "USER") {
        router.push("/dashboard/user");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>SnapTrace | Automate Person Recognition in Video Footage</title>
        <meta
          name="description"
          content="SnapTrace is a video analysis tool that automates person recognition using facial recognition and clothing detection, designed for surveillance in formal environments."
        />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Header />

        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Automate Person Recognition in Video Footage
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              SnapTrace integrates facial recognition and clothing detection to
              accurately identify individuals in video recordings, providing
              timestamped screenshots for every appearance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="px-8 py-3 text-lg">
                  Start Analyzing Videos
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

        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover how SnapTrace enhances video analysis with advanced
                recognition technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <VideoCameraIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Real-Time Video Processing
                </h3>
                <p className="text-gray-600">
                  Analyze video footage in real-time for immediate results.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <UserCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Facial Recognition
                </h3>
                <p className="text-gray-600">
                  Accurately identify individuals using advanced facial
                  recognition technology.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Clothing Attribute Detection
                </h3>
                <p className="text-gray-600">
                  Enhance recognition accuracy by detecting clothing attributes.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Timestamped Screenshots
                </h3>
                <p className="text-gray-600">
                  Receive detailed outputs with timestamps and screenshots of
                  each appearance.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Cross-Device Accessibility
                </h3>
                <p className="text-gray-600">
                  Access SnapTrace from any device with our responsive web
                  interface.
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Secure and Reliable
                </h3>
                <p className="text-gray-600">
                  Your data is handled securely with industry-leading
                  protection.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                How SnapTrace Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A simple and efficient process to analyze your video footage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-4">1</div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Upload Video
                </h3>
                <p className="text-gray-600">
                  Upload your video footage to the SnapTrace platform.
                </p>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-4">2</div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Provide Description
                </h3>
                <p className="text-gray-600">
                  Optionally, provide a description of the person&apos;s
                  clothing to enhance detection.
                </p>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-4">3</div>
                <h3 className="text-xl font-bold mb-2 text-black">
                  Get Results
                </h3>
                <p className="text-gray-600">
                  Receive timestamped screenshots of the individual&apos;s
                  appearances in the video.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Select the subscription that best fits your video analysis
                needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-gray-50 rounded-lg shadow-lg overflow-hidden ${
                    plan.mostPopular ? "ring-2 ring-blue-600" : ""
                  }`}
                >
                  {plan.mostPopular && (
                    <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-black">
                      {plan.name}
                    </h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-4xl font-bold text-black">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-500 ml-1">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-gray-600">{plan.description}</p>

                    <ul className="mt-6 space-y-4">
                      {plan.features.map((feature) => (
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
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                About SnapTrace
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Developed to address the limitations of traditional facial
                recognition in video analysis.
              </p>
              <p className="text-gray-600 mb-6">
                SnapTrace was created to provide a more accurate and efficient
                way to identify individuals in video footage, especially in
                formal environments like offices. By integrating facial
                recognition with clothing attribute detection, SnapTrace
                overcomes challenges posed by obscured faces or varying video
                quality.
              </p>
              <p className="text-gray-600">
                Leveraging advanced datasets like DeepFashion-MultiModal and
                Market-1501, SnapTrace ensures reliable person recognition,
                making it an essential tool for surveillance and video analysis.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to enhance your video analysis?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Experience the power of automated person recognition with
              SnapTrace.
            </p>
            <div className="flex justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-blue-50"
                >
                  Get Started with SnapTrace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="py-12 bg-gray-900 text-gray-400">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white text-lg font-bold mb-4">SnapTrace</h3>
                <p className="mb-4">
                  Automate person recognition in video footage with advanced
                  technology.
                </p>
                <p>
                  © {new Date().getFullYear()} SnapTrace. All rights reserved.
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
                    <Link href="#how-it-works" className="hover:text-white">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="hover:text-white">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#about" className="hover:text-white">
                      About
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white text-lg font-bold mb-4">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-white">
                      Documentation
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
                    <Link
                      href="https://twitter.com/SnapTrace"
                      className="hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://www.facebook.com/SnapTrace"
                      className="hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://www.instagram.com/SnapTrace"
                      className="hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://www.linkedin.com/company/SnapTrace"
                      className="hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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
