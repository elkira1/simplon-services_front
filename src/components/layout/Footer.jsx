import React from "react";

const Footer = () => {
  return (
    <footer className="px-6 py-4 border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-2">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="text-red-600 font-semibold">Simplon Côte d'Ivoire</span>{" "}
          · Gestion Services
        </p>
        <p>
          Support :{" "}
          <a
            className="text-gray-700 hover:text-red-600 transition-colors"
            href="mailto:support@simplon.ci"
          >
            vsawadogo.ext@simplon.co
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
