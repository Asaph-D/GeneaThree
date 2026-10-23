// src/components/tree/types.ts
import * as d3 from 'd3';
import { Person } from '../../types/family';

export interface TreeNode extends d3.HierarchyNode<Person> {
  x0?: number;
  y0?: number;
  relationship?: string;
}

export interface EditableNodeData {
  id: string;
  firstName: string;
  lastName: string;
  originalFirstName: string;
  originalLastName: string;
}