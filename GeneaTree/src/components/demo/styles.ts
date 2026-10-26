// src\components\demo\styles.ts
export const printStyles = `
  @media print {
    .tree-visualization-container {
      width: 100% !important;
      height: 100vh !important;
      page-break-inside: avoid;
    }

    [data-print-control], button, .controls, .tree-zoom-controls, .context-menu, .edit-indicator, .edit-icon {
      display: none !important;
    }

    svg {
      width: 100% !important;
      height: 100% !important;
    }

    .tree-node text {
      font-family: Arial, sans-serif;
      font-weight: 600;
    }

    .relationship-legend {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: white;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 10px;
    }

    .relationship-legend-item {
      display: flex;
      align-items: center;
      margin: 3px 0;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 5px;
    }

    .family-title {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 10px;
    }
  }
`;
