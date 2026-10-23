import React, { useState } from 'react';
import { X, Link, FolderLock as UserLock, Mail, FacebookIcon, Twitter, Linkedin, Send } from 'lucide-react';
import { Person } from '../../types/family';

export interface ShareModalProps {
  onClose: () => void;
  familyData: Person[];
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState<string>('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md p-6 transition-colors duration-300 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Partager votre arbre</h3>
          <button onClick={onClose} className="text-gray-400 transition-colors duration-300 hover:text-gray-500 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Choisissez comment vous souhaitez partager votre arbre généalogique:</p>

          <div className="flex items-center p-3 transition-colors duration-300 border border-gray-300 rounded-md dark:border-gray-600">
            <div className="p-2 transition-colors duration-300 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
              <Link className="w-4 h-4" />
            </div>
            <div className="flex-grow ml-3">
              <h4 className="text-sm font-medium text-gray-900 transition-colors duration-300 dark:text-white">Lien public</h4>
              <p className="text-xs text-gray-500 transition-colors duration-300 dark:text-gray-400">Accessible sans connexion</p>
            </div>
            <div>
              <button className="text-sm font-medium transition-colors duration-300 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">Générer</button>
            </div>
          </div>

          <div className="flex items-center p-3 transition-colors duration-300 border border-gray-300 rounded-md dark:border-gray-600">
            <div className="p-2 transition-colors duration-300 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
              <UserLock className="w-4 h-4" />
            </div>
            <div className="flex-grow ml-3">
              <h4 className="text-sm font-medium text-gray-900 transition-colors duration-300 dark:text-white">Lien privé</h4>
              <p className="text-xs text-gray-500 transition-colors duration-300 dark:text-gray-400">Nécessite une connexion</p>
            </div>
            <div>
              <button className="text-sm font-medium transition-colors duration-300 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">Générer</button>
            </div>
          </div>

          <div>
            <label htmlFor="email-invite" className="block text-sm font-medium text-gray-700 transition-colors duration-300 dark:text-gray-300">Inviter par e-mail</label>
            <div className="flex mt-1 transition-colors duration-300 rounded-md shadow-sm">
              <input 
                type="text" 
                name="email-invite" 
                id="email-invite" 
                value={email}
                onChange={handleEmailChange}
                className="flex-grow block w-full min-w-0 transition-colors duration-300 border-gray-300 rounded-none focus:ring-primary-500 focus:border-primary-500 rounded-l-md sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300" 
                placeholder="email@exemple.com"
              />
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-300 border border-transparent rounded-r-md bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Inviter
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 transition-colors duration-300 dark:text-gray-300">Partager sur</label>
            <div className="flex justify-center space-x-4 transition-colors duration-300">
              <a href="#" className="p-2 text-white transition-colors duration-300 bg-blue-600 rounded-full hover:bg-blue-700">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 text-white transition-colors duration-300 bg-blue-400 rounded-full hover:bg-blue-500">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 text-white transition-colors duration-300 bg-green-600 rounded-full hover:bg-green-700">
                <Send className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 text-white transition-colors duration-300 bg-blue-700 rounded-full hover:bg-blue-800">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 text-white transition-colors duration-300 bg-red-600 rounded-full hover:bg-red-700">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button 
            onClick={onClose}
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-colors duration-300 border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;