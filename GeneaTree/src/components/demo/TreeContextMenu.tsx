// src/components/tree/components/TreeContextMenu.tsx
import React from 'react';
import { Trash2, Baby, Users, Heart } from 'lucide-react';

interface TreeContextMenuProps {
  position: { x: number; y: number; personId: string };
  onAddChild: () => void;
  onAddParent: () => void;
  onAddSpouse: () => void;
  onDelete: () => void;
}

const TreeContextMenu: React.FC<TreeContextMenuProps> = ({
  position,
  onAddChild,
  onAddParent,
  onAddSpouse,
  onDelete
}) => {
  return (
    <div
      className="context-menu fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 min-w-48"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
        Actions rapides
      </div>
      
      <button
        onClick={onAddParent}
        className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Users className="w-4 h-4 mr-2 text-blue-500" />
        Ajouter un parent
      </button>
      
      <button
        onClick={onAddSpouse}
        className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Heart className="w-4 h-4 mr-2 text-red-500" />
        Ajouter conjoint(e)
      </button>
      
      <button
        onClick={onAddChild}
        className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Baby className="w-4 h-4 mr-2 text-green-500" />
        Ajouter un enfant
      </button>
      
      <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
        <button
          onClick={onDelete}
          className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </button>
      </div>
    </div>
  );
};

export default TreeContextMenu;
