import { Plus, Trash2, User } from 'lucide-react';
import React from 'react';

interface TreeContextMenuProps {
  position: { x: number; y: number; personId: string };
  onAddChild: () => void;
  onAddParent: () => void;
  onAddSpouse: () => void;
  onDelete: () => void;
}

const TreeContextMenu: React.FC<TreeContextMenuProps> = ({ position, onAddChild, onAddParent, onAddSpouse, onDelete }) => {
  return (
    <div
      className="context-menu"
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
      }}
    >
      <div className="px-3 py-1 font-medium bg-gray-100 border-b border-gray-200 context-menu-title">
        Actions
      </div>
      <div className="py-1">
        <button
          className="flex items-center w-full px-4 py-1 text-left hover:bg-gray-100"
          onClick={onAddChild}
        >
          <Plus size={16} className="mr-2" /> Ajouter un enfant
        </button>
        <button
          className="flex items-center w-full px-4 py-1 text-left hover:bg-gray-100"
          onClick={onAddParent}
        >
          <Plus size={16} className="mr-2" /> Ajouter un parent
        </button>
        <button
          className="flex items-center w-full px-4 py-1 text-left hover:bg-gray-100"
          onClick={onAddSpouse}
        >
          <User size={16} className="mr-2" /> Ajouter un conjoint
        </button>
        <div className="my-1 border-t border-gray-200"></div>
        <button
          className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors duration-150"
          onClick={onDelete}
        >
          <Trash2 size={16} className="mr-2" /> Supprimer
        </button>
      </div>
    </div>
  );
};

export default TreeContextMenu;
