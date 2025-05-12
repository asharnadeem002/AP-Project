import React, { JSX, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  PhotoIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../lib/AuthContext";

type SidebarItem = {
  name: string;
  href: string;
  icon: (props: React.ComponentProps<"svg">) => JSX.Element;
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const userNavItems: SidebarItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard/user",
      icon: (props: React.ComponentProps<"svg">) => <HomeIcon {...props} />,
    },
    {
      name: "Blog",
      href: "/blog",
      icon: (props: React.ComponentProps<"svg">) => (
        <DocumentTextIcon {...props} />
      ),
    },
    ...(user?.role === "USER"
      ? [
          {
            name: "Gallery",
            href: "/dashboard/user/gallery",
            icon: (props: React.ComponentProps<"svg">) => (
              <PhotoIcon {...props} />
            ),
          },
          {
            name: "Favorites",
            href: "/dashboard/user/gallery/favorites",
            icon: (props: React.ComponentProps<"svg">) => (
              <StarIcon {...props} />
            ),
          },
        ]
      : []),
    {
      name: "Subscription",
      href: "/subscription",
      icon: (props: React.ComponentProps<"svg">) => (
        <CreditCardIcon {...props} />
      ),
    },
    {
      name: "Settings",
      href: "/dashboard/user/settings",
      icon: (props: React.ComponentProps<"svg">) => (
        <Cog6ToothIcon {...props} />
      ),
    },
  ];

  const adminNavItems: SidebarItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard/admin",
      icon: (props: React.ComponentProps<"svg">) => <HomeIcon {...props} />,
    },
    {
      name: "Blog",
      href: "/dashboard/admin/blog",
      icon: (props: React.ComponentProps<"svg">) => (
        <PencilSquareIcon {...props} />
      ),
    },
    {
      name: "Users",
      href: "/dashboard/admin/users",
      icon: (props: React.ComponentProps<"svg">) => <UsersIcon {...props} />,
    },
    {
      name: "Pending Approvals",
      href: "/dashboard/admin/pending-users",
      icon: (props: React.ComponentProps<"svg">) => (
        <DocumentTextIcon {...props} />
      ),
    },
    {
      name: "Subscriptions",
      href: "/dashboard/admin/subscriptions",
      icon: (props: React.ComponentProps<"svg">) => (
        <CreditCardIcon {...props} />
      ),
    },
    {
      name: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: (props: React.ComponentProps<"svg">) => <ChartBarIcon {...props} />,
    },
    {
      name: "Settings",
      href: "/dashboard/admin/settings",
      icon: (props: React.ComponentProps<"svg">) => (
        <Cog6ToothIcon {...props} />
      ),
    },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const isPathActive = (href: string) => {
    if (pathname === href) return true;

    if (href === "/dashboard/user/gallery") {
      return (
        pathname === href || pathname === "/dashboard/user/gallery/favorites"
      );
    }

    if (pathname?.startsWith(href)) {
      const nextChar = pathname[href.length];
      return nextChar === "/" || nextChar === undefined;
    }

    return false;
  };

  return (
    <div
      className={`bg-slate-800 text-white flex flex-col h-screen ${
        collapsed ? "w-16" : "w-64"
      } transition-width duration-300 ease-in-out sticky top-0 left-0`}
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        {!collapsed && (
          <Link href="/dashboard" className="text-xl font-bold">
            SnapTrace
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-full hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = isPathActive(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-md ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <item.icon
                    className="h-5 w-5 mr-3 flex-shrink-0"
                    aria-hidden="true"
                  />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      {!collapsed && user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user.profilePicture ? (
                <div className="relative w-10 h-10">
                  <Image
                    className="rounded-full object-cover"
                    src={user.profilePicture}
                    alt={user.username}
                    fill
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
