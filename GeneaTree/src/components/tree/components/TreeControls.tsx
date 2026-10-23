// src/components/tree/components/TreeControls.tsx
import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import * as d3 from 'd3';

interface TreeControlsProps {
  zoomRef: React.RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onRelationshipSelect: (relationship: string | null) => void;
  selectedRelationship: string | null;
}

const TreeControls: React.FC<TreeControlsProps> = ({
  zoomRef,
  svgRef,
  onRelationshipSelect,
  selectedRelationship
}) => {
  const handleZoomIn = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 0.75);
    }
  };

  const handleResetZoom = () => {
    if (zoomRef.current && svgRef.current) {
      const svg = d3.select(svgRef.current);
      const width = parseInt(svg.attr('width'));
      const height = parseInt(svg.attr('height'));
      
      const resetTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(0.9);
        
      svg.transition()
        .duration(500)
        .call(zoomRef.current.transform, resetTransform);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Zoom avant"
        >
          <ZoomIn className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-600"
          title="Zoom arrière"
        >
          <ZoomOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-600"
          title="Réinitialiser la vue"
        >
          <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3 max-w-48">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
          Filtrer par relation
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => onRelationshipSelect(null)}
            className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
              !selectedRelationship 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            Tout afficher
          </button>
          {[
            { id: 'parent', label: 'Parents' },
            { id: 'child', label: 'Enfants' },
            { id: 'sibling', label: 'Fratrie' },
            { id: 'spouse', label: 'Conjoints' }
          ].map(relation => (
            <button
              key={relation.id}
              onClick={() => onRelationshipSelect(relation.id)}
              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                selectedRelationship === relation.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {relation.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TreeControls;