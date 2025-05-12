import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../lib/AuthContext";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navLinks = user
    ? [
        { name: "Dashboard", href: "/dashboard" },
        ...(user.role === "USER"
          ? [{ name: "Gallery", href: "/dashboard/user/gallery" }]
          : []),
        { name: "Subscription", href: "/subscription" },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "Features", href: "/#features" },
        { name: "Pricing", href: "/#pricing" },
        { name: "About", href: "/#about" },
      ];

  const profileMenuItems = [{ name: "Profile", href: "/profile" }];

  return (
    <header className="bg-white shadow-sm dark:bg-slate-900 sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center">
          <div className="flex-1 flex items-center">
            {!user && (
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-500">
                  SnapTrace
                </span>
              </Link>
            )}
          </div>

          <div className="flex-1 hidden md:flex justify-center items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  pathname === link.href
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex-1 flex items-center justify-end">
            {user ? (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  {user.profilePicture ? (
                    <div className="relative w-10 h-10">
                      <Image
                        className="rounded-full object-cover"
                        src={user.profilePicture}
                        alt="User profile"
                        fill
                        sizes="32px"
                      />
                    </div>
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-500" />
                  )}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-slate-800">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}

            <div className="flex md:hidden ml-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === link.href
                      ? "bg-gray-100 text-blue-600 dark:bg-slate-800 dark:text-blue-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {!user && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-slate-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
