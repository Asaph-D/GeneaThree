// types/advanced-family.ts - Types pour collecte généalogique avancée

export interface GenerationConfig {
  maxAscendants: number; // Générations vers le haut (grands-parents, etc.)
  maxDescendants: number; // Générations vers le bas (petits-enfants, etc.)
  maxLateralDepth: number; // Largeur familiale (oncles/tantes, cousins)
  collectSpousesOfRelatives: boolean; // Collecter les conjoints des parents/frères/etc.
  collectInLaws: boolean; // Beaux-parents, beaux-frères, etc.
}

export interface FamilyCollectionState extends CollectionState {
  generationConfig: GenerationConfig;
  currentGeneration: number; // -3 (arrière-grands-parents) à +3 (arrière-petits-enfants)
  currentBranch: 'paternal' | 'maternal' | 'direct' | null;
  familyTree: Map<string, FamilyNode>;
  collectionQueue: CollectionTask[];
}

export interface FamilyNode extends CollectorPerson {
  generation: number; // Génération relative à l'utilisateur (0 = utilisateur)
  branch: 'paternal' | 'maternal' | 'direct' | 'spouse' | 'lateral';
  collected: boolean;
  priority: number; // Ordre de collecte
  relationships: RelationshipMap;
}

export interface RelationshipMap {
  parents: string[];
  children: string[];
  siblings: string[];
  spouses: string[];
  grandparents: string[];
  grandchildren: string[];
  uncles: string[];
  aunts: string[];
  cousins: string[];
  nephews: string[];
  nieces: string[];
  inLaws: string[];
}

export interface CollectionTask {
  personId: string;
  relationship: string;
  generation: number;
  branch: string;
  priority: number;
  parentContext?: string; // Pour les enfants d'oncles/tantes
  prompt: string;
}

// Gestionnaire avancé de collecte familiale
export class AdvancedFamilyCollector {
  private state: FamilyCollectionState;
  private config: GenerationConfig;

  constructor(config: GenerationConfig = {
    maxAscendants: 3,
    maxDescendants: 3,
    maxLateralDepth: 2,
    collectSpousesOfRelatives: true,
    collectInLaws: false
  }) {
    this.config = config;
    this.state = {
      ...this.initializeState(),
      generationConfig: config,
      currentGeneration: 0,
      currentBranch: 'direct',
      familyTree: new Map(),
      collectionQueue: []
    };
  }

  // Génère la séquence complète de collecte
  generateCollectionSequence(userId: string): CollectionTask[] {
    const tasks: CollectionTask[] = [];
    let priority = 1;

    // 1. Informations de base de l'utilisateur
    tasks.push(this.createTask(userId, 'self', 0, 'direct', priority++, 
      'Commençons par vos informations personnelles'));

    // 2. Famille nucléaire directe
    tasks.push(...this.generateNuclearFamilyTasks(userId, priority));
    priority += 10;

    // 3. Générations ascendantes (grands-parents, arrière-grands-parents)
    for (let gen = 1; gen <= this.config.maxAscendants; gen++) {
      tasks.push(...this.generateAscendantTasks(gen, priority));
      priority += 20;
    }

    // 4. Générations descendantes (petits-enfants, arrière-petits-enfants)
    for (let gen = 1; gen <= this.config.maxDescendants; gen++) {
      tasks.push(...this.generateDescendantTasks(gen, priority));
      priority += 20;
    }

    // 5. Famille étendue latérale
    tasks.push(...this.generateLateralFamilyTasks(priority));

    return tasks.sort((a, b) => a.priority - b.priority);
  }

  private generateNuclearFamilyTasks(userId: string, startPriority: number): CollectionTask[] {
    return [
      this.createTask('parents', 'parents', 1, 'direct', startPriority,
        'Parlons de vos parents'),
      this.createTask('siblings', 'siblings', 0, 'direct', startPriority + 1,
        'Avez-vous des frères et sœurs ?'),
      this.createTask('spouse', 'spouse', 0, 'direct', startPriority + 2,
        'Êtes-vous marié(e) ou en couple ?'),
      this.createTask('children', 'children', -1, 'direct', startPriority + 3,
        'Avez-vous des enfants ?')
    ];
  }

  private generateAscendantTasks(generation: number, startPriority: number): CollectionTask[] {
    const tasks: CollectionTask[] = [];
    
    if (generation === 2) {
      // Grands-parents
      tasks.push(
        this.createTask('paternal-grandparents', 'grandparents', 2, 'paternal', 
          startPriority, 'Parlons des parents de votre père (vos grands-parents paternels)'),
        this.createTask('maternal-grandparents', 'grandparents', 2, 'maternal', 
          startPriority + 1, 'Et maintenant des parents de votre mère (vos grands-parents maternels)')
      );
    } else if (generation === 3) {
      // Arrière-grands-parents
      tasks.push(
        this.createTask('paternal-great-grandparents', 'great-grandparents', 3, 'paternal', 
          startPriority, 'Connaissez-vous vos arrière-grands-parents du côté paternel ?'),
        this.createTask('maternal-great-grandparents', 'great-grandparents', 3, 'maternal', 
          startPriority + 1, 'Et du côté maternel ?')
      );
    }

    return tasks;
  }

  private generateDescendantTasks(generation: number, startPriority: number): CollectionTask[] {
    const tasks: CollectionTask[] = [];
    
    if (generation === 1) {
      // Petits-enfants (enfants de vos enfants)
      tasks.push(
        this.createTask('grandchildren', 'grandchildren', -2, 'direct', 
          startPriority, 'Vos enfants ont-ils des enfants ? (vos petits-enfants)')
      );
    } else if (generation === 2) {
      // Arrière-petits-enfants
      tasks.push(
        this.createTask('great-grandchildren', 'great-grandchildren', -3, 'direct', 
          startPriority, 'Avez-vous des arrière-petits-enfants ?')
      );
    }

    return tasks;
  }

  private generateLateralFamilyTasks(startPriority: number): CollectionTask[] {
    const tasks: CollectionTask[] = [];
    
    // Oncles et tantes
    tasks.push(
      this.createTask('paternal-uncles-aunts', 'uncles-aunts', 1, 'paternal', 
        startPriority, 'Votre père a-t-il des frères et sœurs ? (vos oncles et tantes paternels)'),
      this.createTask('maternal-uncles-aunts', 'uncles-aunts', 1, 'maternal', 
        startPriority + 1, 'Et votre mère ? (vos oncles et tantes maternels)')
    );

    if (this.config.maxLateralDepth >= 2) {
      // Cousins (enfants des oncles/tantes)
      tasks.push(
        this.createTask('paternal-cousins', 'cousins', 0, 'lateral', 
          startPriority + 2, 'Vos oncles et tantes paternels ont-ils des enfants ? (vos cousins paternels)'),
        this.createTask('maternal-cousins', 'cousins', 0, 'lateral', 
          startPriority + 3, 'Et du côté maternel ? (vos cousins maternels)')
      );

      // Neveux et nièces (enfants de vos frères/sœurs)
      tasks.push(
        this.createTask('nephews-nieces', 'nephews-nieces', -1, 'lateral', 
          startPriority + 4, 'Vos frères et sœurs ont-ils des enfants ? (vos neveux et nièces)')
      );
    }

    return tasks;
  }

  private createTask(
    personId: string, 
    relationship: string, 
    generation: number, 
    branch: string, 
    priority: number, 
    prompt: string,
    parentContext?: string
  ): CollectionTask {
    return {
      personId,
      relationship,
      generation,
      branch,
      priority,
      parentContext,
      prompt
    };
  }

  // Processus de collecte avec gestion intelligente des priorités
  async processCollectionTask(task: CollectionTask, userResponse: string): Promise<CollectionResult> {
    const isYes = userResponse.toLowerCase().startsWith('o');
    
    switch (task.relationship) {
      case 'parents':
        return this.processParentsCollection(task, isYes);
      case 'grandparents':
        return this.processGrandparentsCollection(task, isYes);
      case 'uncles-aunts':
        return this.processUnclesAuntsCollection(task, isYes);
      case 'cousins':
        return this.processCousinsCollection(task, isYes);
      case 'nephews-nieces':
        return this.processNephewsNiecesCollection(task, isYes);
      default:
        return this.processGenericCollection(task, userResponse);
    }
  }

  private processParentsCollection(task: CollectionTask, hasParents: boolean): CollectionResult {
    if (!hasParents) {
      return {
        completed: true,
        nextTasks: [],
        message: 'D\'accord, passons à la suite.'
      };
    }

    const detailTasks: CollectionTask[] = [
      this.createTask('father', 'parent-detail', 1, 'paternal', task.priority + 0.1,
        'Comment s\'appelle votre père ?'),
      this.createTask('mother', 'parent-detail', 1, 'maternal', task.priority + 0.2,
        'Et votre mère ?')
    ];

    // Si on collecte les grands-parents, ajouter les tâches correspondantes
    if (this.config.maxAscendants >= 2) {
      detailTasks.push(
        this.createTask('paternal-grandparents-check', 'grandparents-check', 2, 'paternal', 
          task.priority + 0.3, 'Connaissez-vous les parents de votre père ?'),
        this.createTask('maternal-grandparents-check', 'grandparents-check', 2, 'maternal', 
          task.priority + 0.4, 'Et les parents de votre mère ?')
      );
    }

    return {
      completed: false,
      nextTasks: detailTasks,
      message: 'Super ! Commençons par votre père. Comment s\'appelle-t-il ?'
    };
  }

  private processGrandparentsCollection(task: CollectionTask, hasGrandparents: boolean): CollectionResult {
    if (!hasGrandparents) {
      return {
        completed: true,
        nextTasks: [],
        message: 'Pas de problème, nous pouvons passer à autre chose.'
      };
    }

    const branch = task.branch as 'paternal' | 'maternal';
    const branchLabel = branch === 'paternal' ? 'paternel' : 'maternel';
    
    const detailTasks: CollectionTask[] = [
      this.createTask(`${branch}-grandfather`, 'grandparent-detail', 2, branch, 
        task.priority + 0.1, `Comment s'appelait votre grand-père ${branchLabel} ?`),
      this.createTask(`${branch}-grandmother`, 'grandparent-detail', 2, branch, 
        task.priority + 0.2, `Et votre grand-mère ${branchLabel} ?`)
    ];

    // Si on va plus loin dans les générations
    if (this.config.maxAscendants >= 3) {
      detailTasks.push(
        this.createTask(`${branch}-great-grandparents-check`, 'great-grandparents-check', 3, branch, 
          task.priority + 0.3, `Connaissez-vous les parents de vos grands-parents ${branchLabel}s ?`)
      );
    }

    return {
      completed: false,
      nextTasks: detailTasks,
      message: `Parfait ! Comment s'appelait votre grand-père ${branchLabel} ?`
    };
  }

  private processUnclesAuntsCollection(task: CollectionTask, hasUnclesAunts: boolean): CollectionResult {
    if (!hasUnclesAunts) {
      return {
        completed: true,
        nextTasks: [],
        message: 'D\'accord, continuons.'
      };
    }

    const branch = task.branch as 'paternal' | 'maternal';
    const branchLabel = branch === 'paternal' ? 'paternel' : 'maternel';

    return {
      completed: false,
      nextTasks: [
        this.createTask(`${branch}-uncles-aunts-count`, 'uncles-aunts-count', 1, branch,
          task.priority + 0.1, `Combien d'oncles et tantes avez-vous du côté ${branchLabel} ?`)
      ],
      message: `Combien d'oncles et tantes avez-vous du côté ${branchLabel} ?`
    };
  }

  private processCousinsCollection(task: CollectionTask, hasCousins: boolean): CollectionResult {
    if (!hasCousins) {
      return {
        completed: true,
        nextTasks: [],
        message: 'Très bien.'
      };
    }

    const branch = task.branch;
    const branchLabel = branch === 'paternal' ? 'paternels' : 'maternels';

    return {
      completed: false,
      nextTasks: [
        this.createTask(`${branch}-cousins-count`, 'cousins-count', 0, 'lateral',
          task.priority + 0.1, `Combien de cousins ${branchLabel} avez-vous ?`)
      ],
      message: `Combien de cousins ${branchLabel} avez-vous ?`
    };
  }

  private processNephewsNiecesCollection(task: CollectionTask, hasNephewsNieces: boolean): CollectionResult {
    if (!hasNephewsNieces) {
      return {
        completed: true,
        nextTasks: [],
        message: 'Compris.'
      };
    }

    return {
      completed: false,
      nextTasks: [
        this.createTask('nephews-nieces-count', 'nephews-nieces-count', -1, 'lateral',
          task.priority + 0.1, 'Combien de neveux et nièces avez-vous ?')
      ],
      message: 'Combien de neveux et nièces avez-vous ?'
    };
  }

  private processGenericCollection(task: CollectionTask, response: string): CollectionResult {
    void task;
    void response;
    // Traitement générique pour les noms, dates, etc.
    return {
      completed: true,
      nextTasks: [],
      message: 'Merci ! Continuons.'
    };
  }

  // Estimation du temps de collecte
  estimateCollectionTime(): CollectionEstimate {
    const tasks = this.generateCollectionSequence('user');
    const averageTimePerQuestion = 15; // secondes
    const totalQuestions = tasks.length;
    
    return {
      totalQuestions,
      estimatedMinutes: Math.ceil((totalQuestions * averageTimePerQuestion) / 60),
      generationsUp: this.config.maxAscendants,
      generationsDown: this.config.maxDescendants,
      lateralDepth: this.config.maxLateralDepth,
      potentialFamilyMembers: this.calculatePotentialMembers()
    };
  }

  private calculatePotentialMembers(): number {
    let total = 1; // L'utilisateur
    
    // Génération 0 : utilisateur + conjoints + frères/sœurs
    total += 1 + 4; // conjoint + 4 frères/sœurs moyens
    
    // Générations ascendantes
    for (let i = 1; i <= this.config.maxAscendants; i++) {
      total += Math.pow(2, i) * 2; // 2 parents par personne de la génération précédente
    }
    
    // Générations descendantes  
    for (let i = 1; i <= this.config.maxDescendants; i++) {
      total += Math.pow(2, i) * 1.5; // 1.5 enfants moyens par personne
    }
    
    // Famille latérale
    if (this.config.maxLateralDepth >= 1) {
      total += 6; // Oncles/tantes moyens
    }
    if (this.config.maxLateralDepth >= 2) {
      total += 12; // Cousins moyens
      total += 3; // Neveux/nièces moyens
    }
    
    return Math.round(total);
  }
}

export interface CollectionResult {
  completed: boolean;
  nextTasks: CollectionTask[];
  message: string;
  error?: string;
}

export interface CollectionEstimate {
  totalQuestions: number;
  estimatedMinutes: number;
  generationsUp: number;
  generationsDown: number;
  lateralDepth: number;
  potentialFamilyMembers: number;
}
