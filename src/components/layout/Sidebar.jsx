import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  FileText,
  Plus,
  CheckSquare,
  BarChart3,
  Users,
  ClipboardList,
  Megaphone,
  Wallet,
} from "lucide-react";

const Sidebar = () => {
  const { user } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      allowedRoles: ["employee", "mg", "accounting", "director"],
    },
    {
      name: "Mes demandes",
      href: "/requests",
      icon: FileText,
      allowedRoles: ["employee", "mg", "accounting", "director"],
    },
    {
      name: "Mise à disposition",
      href: "/provisions",
      icon: ClipboardList,
      allowedRoles: ["employee", "mg", "accounting", "director"],
    },
    {
      name: "Signalements",
      href: "/reports",
      icon: Megaphone,
      allowedRoles: ["employee", "mg", "accounting", "director"],
    },
    {
      name: "Budget",
      href: "/budgets",
      icon: Wallet,
      allowedRoles: ["accounting"],
    },
    {
      name: "Budget Stats",
      href: "/budgets/statistics",
      icon: BarChart3,
      allowedRoles: ["accounting", "director"],
    },
    {
      name: "Nouvelle demande",
      href: "/requests/create",
      icon: Plus,
      allowedRoles: ["employee", "mg"],
    },
    {
      name: "Validations",
      href: "/validations",
      icon: CheckSquare,
      allowedRoles: ["mg", "accounting", "director"],
    },
    {
      name: "Gestion utilisateurs",
      href: "/users",
      icon: Users,
      allowedRoles: ["mg", "director"],
    },
    {
      name: "Statistiques",
      href: "/statistics",
      icon: BarChart3,
      allowedRoles: ["mg", "director"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.allowedRoles.includes(user?.role)
  );

  const routesWithExactMatch = new Set(["/", "/requests", "/budgets"]);

  return (
    <div className="hidden md:flex md:flex-col min-h-screen w-52 flex-shrink-0">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200 w-full">
        <div className="flex flex-col flex-grow px-2">
          <nav className="flex-1 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={routesWithExactMatch.has(item.href)}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors w-full ${
                      isActive
                        ? "bg-red-600 text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <Icon
                    className="mr-3 flex-shrink-0 h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
