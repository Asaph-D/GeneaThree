import { Facebook, Instagram, Trees as Tree, Twitter, Youtube } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-300">
      <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <Tree className="w-6 h-6 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-white">
                GeneaTree<span className="text-primary-500">Pro</span>
              </span>
            </div>
            <p className="text-base text-gray-300">
              Explorez, préservez et partagez votre histoire familiale avec des outils professionnels et intuitifs.
            </p>
            <div className="flex space-x-6">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-12 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
                  Solutions
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to="/demo" className="text-base text-gray-400 hover:text-white">
                      Démo gratuite
                    </Link>
                  </li>
                  <li>
                    <Link to="/quick-start" className="text-base text-gray-400 hover:text-white">
                      Abonnements
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-base text-gray-400 hover:text-white">
                      Questions fréquentes
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-base text-gray-400 hover:text-white">
                      Présentation
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
                  Support
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to="/faq" className="text-base text-gray-400 hover:text-white">
                      Aide & FAQ
                    </Link>
                  </li>
                  <li>
                    <Link to="/demo" className="text-base text-gray-400 hover:text-white">
                      Tutoriels interactifs
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:support@geneatree.com" className="text-base text-gray-400 hover:text-white">
                      Support
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.geneatree.com" target="_blank" rel="noopener noreferrer" className="text-base text-gray-400 hover:text-white">
                      Documentation
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
                  Entreprise
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to="/about" className="text-base text-gray-400 hover:text-white">
                      À propos
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-400 hover:text-white">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-400 hover:text-white">
                      Emplois
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-400 hover:text-white">
                      Partenaires
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase">
                  Légal
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-gray-400 hover:text-white">
                      Confidentialité
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-400 hover:text-white">
                      Conditions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-400 hover:text-white">
                      Mentions légales
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-gray-400 hover:text-white">
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-8 mt-12 border-t border-gray-700">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; 2025 GeneaTreePro. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
