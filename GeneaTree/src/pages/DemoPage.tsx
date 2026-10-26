// src/pages/DemoPage.tsx
import { Bot, ChevronLeft, ChevronRight, PanelLeft, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadFamily, saveFamily } from '../services/familyGateway';
import DemoControls from '../components/demo/DemoControls';
import FamilyStats from '../components/demo/FamilyStats';
import PersonProfileCard, { ProfileAnchor } from '../components/demo/PersonProfileCard';
import { printStyles } from '../components/demo/styles';
import TreeVisualization from '../components/demo/TreeVisualization';
import { descendantIds, isolatedAfterDeletion } from '../components/demo/deletionPolicy';
import PersonFormModal from '../components/modals/PersonFormModal';
import DeletePersonModal from '../components/modals/DeletePersonModal';
import ShareModal from '../components/modals/ShareModal';
import PdfExportStudio from '../components/modals/PdfExportStudio';
import ImportFamilyModal from '../components/modals/ImportFamilyModal';
import { Marriage, PartialPerson, Person, TreeViewOptions } from '../types/family';
import { getSampleFamily, SAMPLE_FAMILIES } from '../examples/sampleFamilies';
import { FamilyArchive, parseFamilyArchive, serializeFamilyArchive } from '../services/familyTransfer';
import { PdfDesignOptions } from '../services/pdfDesign';

const DemoPage: React.FC = () => {
  const [familyData, setFamilyData] = useState<Person[]>([]);
  const [marriagesData, setMarriagesData] = useState<Marriage[]>([]);
  const [treeOptions, setTreeOptions] = useState<TreeViewOptions>({
    viewType: 'tree',
    generations: 4,
    focusPersonId: '1'
  });
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [pdfStudioOpen, setPdfStudioOpen] = useState(false);
  const [pdfInitialSvg, setPdfInitialSvg] = useState('');
  const [pendingImport, setPendingImport] = useState<{ fileName: string; archive?: FamilyArchive; error?: string } | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPersonFormModalOpen, setIsPersonFormModalOpen] = useState(false);
  const [selectedPersonForEdit, setSelectedPersonForEdit] = useState<Person | null>(null);
  const [relatedPersonForAdd, setRelatedPersonForAdd] = useState<string | null>(null);
  const [addRelationshipType, setAddRelationshipType] = useState<'child' | 'parent' | 'spouse' | null>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deletingPersonIds, setDeletingPersonIds] = useState<string[]>([]);
  const [exampleId, setExampleId] = useState(() => localStorage.getItem('geneatree.example') || 'monogame');
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 767px)').matches);
  const [profileLeaving, setProfileLeaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<ProfileAnchor | null>(null);
  const profilePinned = useRef(false);
  const profileShowTimer = useRef<number>();
  const profileHideTimer = useRef<number>();
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const applySnapshot = useCallback((persons: Person[], marriages: Marriage[], focusId?: string) => {
    const savedFocus = focusId || localStorage.getItem('focusPerson');
    const initialFocusId =
      savedFocus && persons.some((person) => person.id === savedFocus)
        ? savedFocus
        : persons[0]?.id ?? '';
    setFamilyData(persons.map((person) => ({
      ...person,
      relationship: person.id === initialFocusId ? 'self' : '',
    })));
    setMarriagesData(marriages);
    setTreeOptions((prev) => ({ ...prev, focusPersonId: initialFocusId }));
    if (initialFocusId) localStorage.setItem('focusPerson', initialFocusId);
  }, []);

  const applyExample = useCallback(async (id: string) => {
    const sample = getSampleFamily(id);
    setExampleId(sample.id);
    localStorage.setItem('geneatree.example', sample.id);
    await saveFamily(sample.persons, sample.marriages);
    applySnapshot(sample.persons, sample.marriages, sample.focusId);
  }, [applySnapshot]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fromUrl = new URLSearchParams(window.location.search).get('exemple');
      const { persons, marriages } = await loadFamily();
      const knownSample = persons.some((person) => /^(mo|po|re)-/.test(person.id));
      if (fromUrl && SAMPLE_FAMILIES.some((family) => family.id === fromUrl)) {
        const sample = getSampleFamily(fromUrl);
        localStorage.setItem('geneatree.example', sample.id);
        await saveFamily(sample.persons, sample.marriages);
        setExampleId(sample.id);
        applySnapshot(sample.persons, sample.marriages, sample.focusId);
      } else if (localStorage.getItem('geneatree.example') === 'custom' && persons.length > 0) {
        applySnapshot(persons, marriages);
      } else if (!knownSample) {
        const savedExample = localStorage.getItem('geneatree.example');
        const sample = getSampleFamily(savedExample || 'monogame');
        localStorage.setItem('geneatree.example', sample.id);
        await saveFamily(sample.persons, sample.marriages);
        setExampleId(sample.id);
        applySnapshot(sample.persons, sample.marriages, sample.focusId);
      } else {
        const savedExample = localStorage.getItem('geneatree.example');
        if (savedExample && SAMPLE_FAMILIES.some((family) => family.id === savedExample)) {
          setExampleId(savedExample);
        }
        applySnapshot(persons, marriages);
      }
    } catch (err) {
      console.error('Failed to fetch family data:', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger le lignage.');
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  // Mettre à jour les relations après chargement des données
  useEffect(() => {
    document.title = 'Démonstration - GeneaTreePro';
    fetchData();
  }, [fetchData]);

  // Effet pour mettre à jour les relations après le chargement initial
  useEffect(() => {
    if (familyData.length > 0 && treeOptions.focusPersonId) {
      const hasAllRelationships = familyData.every(person => person.relationship !== undefined);

      if (!hasAllRelationships) {
        const updatedFamilyData = familyData.map(person => {
          if (person.id === treeOptions.focusPersonId) {
            return { ...person, relationship: 'self' };
          }

          const focusPerson = familyData.find(p => p.id === treeOptions.focusPersonId);
          if (focusPerson) {
            let relationship = '';

            if (focusPerson.parentIds.includes(person.id)) {
              relationship = 'parent';
            } else if (focusPerson.childrenIds.includes(person.id)) {
              relationship = 'child';
            } else if (focusPerson.spouseIds.includes(person.id)) {
              relationship = 'spouse';
            } else if (focusPerson.siblingIds?.includes(person.id)) {
              relationship = 'sibling';
            } else {
              // Vérifier les grands-parents
              let isGrandparent = false;
              focusPerson.parentIds.forEach(parentId => {
                const parent = familyData.find(p => p.id === parentId);
                if (parent && parent.parentIds.includes(person.id)) {
                  relationship = 'grandparent';
                  isGrandparent = true;
                }
              });

              if (!isGrandparent) {
                // Vérifier les petits-enfants
                let isGrandchild = false;
                focusPerson.childrenIds.forEach(childId => {
                  const child = familyData.find(p => p.id === childId);
                  if (child && child.childrenIds.includes(person.id)) {
                    relationship = 'grandchild';
                    isGrandchild = true;
                  }
                });

                if (!isGrandchild) {
                  relationship = 'other';
                }
              }
            }

            return { ...person, relationship };
          }

          return person;
        });

        setFamilyData(updatedFamilyData);
      }
    }
  }, [treeOptions.focusPersonId]); // Ne dépend plus de familyData

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const apply = () => {
      setNarrow(media.matches);
      if (media.matches) setSidebarOpen(false);
    };
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || loading || !familyData.length || pdfStudioOpen) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('studio') !== 'pdf') return;
    const timer = window.setTimeout(() => {
      setPdfInitialSvg(treeContainerRef.current?.querySelector('[data-tree-canvas] > svg')?.outerHTML ?? '');
      setPdfStudioOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [familyData.length, loading, pdfStudioOpen]);

  useEffect(() => {
    if (!import.meta.env.DEV || loading || !familyData.length || pendingImport) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('importTest') !== '1') return;
    setPendingImport({ fileName: 'famille-asaph.geneatree.json', archive: { format: 'geneatree-family', version: 1, exportedAt: new Date().toISOString(), persons: familyData, marriages: marriagesData, view: treeOptions } });
  }, [familyData, loading, marriagesData, pendingImport, treeOptions]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!document.getElementById('geneatree-print-styles')) {
      const style = document.createElement('style');
      style.id = 'geneatree-print-styles';
      style.innerHTML = printStyles;
      document.head.appendChild(style);
    }
  }, []);

  const handleViewTypeChange = (newViewType: 'tree' | 'radial' | 'vertical' | 'timeline') => {
    setTreeOptions(prev => ({ ...prev, viewType: newViewType }));
  };

  const handleGenerationsChange = (newGenerations: number) => {
    setTreeOptions(prev => ({ ...prev, generations: newGenerations }));
  };

  const handleFocusPersonChange = (newFocusPerson: string) => {
    setTreeOptions(prev => ({ ...prev, focusPersonId: newFocusPerson }));
    localStorage.setItem('focusPerson', newFocusPerson);
  };

  const openProfile = (person: Person, rect: DOMRect, pin = false) => {
    window.clearTimeout(profileHideTimer.current);
    window.clearTimeout(profileShowTimer.current);
    setProfileLeaving(false);
    const apply = () => {
      setProfileId(person.id);
      setProfileAnchor({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    };
    if (pin || profilePinned.current) apply();
    else profileShowTimer.current = window.setTimeout(apply, 220);
  };

  const holdProfile = () => {
    window.clearTimeout(profileHideTimer.current);
    window.clearTimeout(profileShowTimer.current);
    setProfileLeaving(false);
  };

  const beginCloseProfile = () => {
    window.clearTimeout(profileShowTimer.current);
    window.clearTimeout(profileHideTimer.current);
    if (!profilePinned.current && !profileId) return;
    setProfileLeaving(true);
  };

  const releaseProfile = () => {
    window.clearTimeout(profileShowTimer.current);
    window.clearTimeout(profileHideTimer.current);
    profileHideTimer.current = window.setTimeout(() => {
      if (!profilePinned.current) beginCloseProfile();
    }, 420);
  };

  const finishCloseProfile = () => {
    profilePinned.current = false;
    setProfileLeaving(false);
    setProfileId(null);
    setProfileAnchor(null);
  };

  const handlePersonSelect = (person: Person, rect?: DOMRect) => {
    if (isEditMode) {
      setSelectedPersonForEdit(person);
      setRelatedPersonForAdd(null);
      setAddRelationshipType(null);
      setIsPersonFormModalOpen(true);
      return;
    }
    setSelectedPerson(person);
    profilePinned.current = true;
    setProfileLeaving(false);
    setProfileId(person.id);
    if (rect) {
      setProfileAnchor({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
    handleFocusPersonChange(person.id);
  };

  const handleAddPersonClick = (relatedPersonId: string, relationshipType: 'child' | 'parent' | 'spouse') => {
    setSelectedPersonForEdit(null);
    setRelatedPersonForAdd(relatedPersonId);
    setAddRelationshipType(relationshipType);
    setIsPersonFormModalOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPersonForEdit(person);
    setRelatedPersonForAdd(null);
    setAddRelationshipType(null);
    setIsPersonFormModalOpen(true);
  };

  const handleSavePerson = async (personData: PartialPerson & { unionSpouseId?: string; marriageDate?: string; parentExistingChildren?: boolean }) => {
    const blankPlace = { city: '', region: '', country: '' };
    const persist = async (persons: Person[], marriages: Marriage[]) => {
      setFamilyData(persons);
      setMarriagesData(marriages);
      await saveFamily(persons, marriages);
    };
    try {
      if (personData.id) {
        const existing = familyData.find((item) => item.id === personData.id);
        if (!existing) return;
        const updated: Person = {
          ...existing,
          firstName: (personData.firstName ?? existing.firstName).trim(),
          lastName: (personData.lastName ?? existing.lastName).trim(),
          gender: personData.gender || existing.gender,
          birthDate: personData.birthDate || '',
          deathDate: personData.deceased ? (personData.deathDate || '') : '',
          deceased: Boolean(personData.deceased),
          occupation: personData.occupation || '',
          biography: personData.biography || '',
          notes: personData.notes || '',
          photoUrl: personData.photoUrl ?? existing.photoUrl,
          birthPlace: personData.birthPlace || existing.birthPlace,
          deathPlace: personData.deathPlace || existing.deathPlace,
        };
        await persist(familyData.map((item) => item.id === updated.id ? updated : item), marriagesData);
        if (isPersonFormModalOpen) {
          setIsPersonFormModalOpen(false);
          setSelectedPersonForEdit(null);
        }
        return;
      }

      if (!relatedPersonForAdd || !addRelationshipType) {
        throw new Error('Choisissez la personne à laquelle rattacher cet ajout.');
      }
      const related = familyData.find((item) => item.id === relatedPersonForAdd);
      if (!related) throw new Error('La personne liée est introuvable.');

      const newId = `person-${Date.now()}`;
      const created: Person = {
        id: newId,
        firstName: (personData.firstName || '').trim(),
        lastName: (personData.lastName || '').trim(),
        birthDate: personData.birthDate || '',
        birthPlace: personData.birthPlace || blankPlace,
        deathDate: personData.deceased ? (personData.deathDate || '') : '',
        deathPlace: personData.deathPlace || blankPlace,
        gender: personData.gender || 'unknown',
        occupation: personData.occupation || '',
        deceased: Boolean(personData.deceased),
        photoUrl: personData.photoUrl || '',
        biography: personData.biography || '',
        notes: personData.notes || '',
        contact: {},
        parentIds: [],
        childrenIds: [],
        spouseIds: [],
        siblingIds: [],
        eventIds: [],
        relationship: addRelationshipType === 'parent' ? undefined : addRelationshipType,
      };

      const nextPeople = familyData.map((item) => ({
        ...item,
        parentIds: [...item.parentIds],
        childrenIds: [...item.childrenIds],
        spouseIds: [...item.spouseIds],
        siblingIds: [...(item.siblingIds ?? [])],
      }));
      const nextMarriages = marriagesData.map((marriage) => ({
        ...marriage,
        childrenIds: [...(marriage.childrenIds ?? [])],
      }));
      const touch = (id: string) => {
        const found = nextPeople.find((item) => item.id === id);
        if (!found) throw new Error('Une personne du lien est introuvable.');
        return found;
      };

      if (addRelationshipType === 'spouse') {
        const unassignedChildren = personData.parentExistingChildren
          ? related.childrenIds.filter((childId) => !nextMarriages.some((marriage) => marriage.childrenIds?.includes(childId)))
          : [];
        created.spouseIds = [related.id];
        created.childrenIds = unassignedChildren;
        touch(related.id).spouseIds.push(newId);
        unassignedChildren.forEach((childId) => {
          const child = touch(childId);
          child.parentIds = [...new Set([...child.parentIds, newId])];
        });
        nextMarriages.push({
          id: `marriage-${Date.now()}`,
          spouse1Id: related.id,
          spouse2Id: newId,
          marriageDate: personData.marriageDate || '',
          location: blankPlace,
          childrenIds: unassignedChildren,
          rank: nextMarriages.filter((marriage) => marriage.spouse1Id === related.id).length + 1,
        });
      } else if (addRelationshipType === 'child') {
        const unions = nextMarriages.filter((marriage) => marriage.spouse1Id === related.id || marriage.spouse2Id === related.id);
        if (unions.length > 0 && !personData.unionSpouseId) {
          throw new Error('Choisissez l’union qui accueille cet enfant.');
        }
        if (personData.unionSpouseId) {
          const marriage = unions.find((item) => item.spouse1Id === personData.unionSpouseId || item.spouse2Id === personData.unionSpouseId);
          if (!marriage) throw new Error('Cette union n’existe pas.');
          created.parentIds = [marriage.spouse1Id, marriage.spouse2Id];
          created.siblingIds = [...(marriage.childrenIds ?? [])];
          marriage.childrenIds = [...(marriage.childrenIds ?? []), newId];
          touch(marriage.spouse1Id).childrenIds.push(newId);
          if (marriage.spouse2Id !== marriage.spouse1Id) touch(marriage.spouse2Id).childrenIds.push(newId);
          created.siblingIds.forEach((siblingId) => {
            const sibling = touch(siblingId);
            sibling.siblingIds = [...(sibling.siblingIds ?? []), newId];
          });
        } else {
          created.parentIds = [related.id];
          touch(related.id).childrenIds.push(newId);
        }
      } else if (related.parentIds.length >= 2) {
        throw new Error('Cette personne a déjà deux parents.');
      } else {
        created.childrenIds = [related.id];
        touch(related.id).parentIds.push(newId);
        if (related.parentIds.length === 1) {
          const existingParentId = related.parentIds[0];
          created.spouseIds = [existingParentId];
          touch(existingParentId).spouseIds.push(newId);
          nextMarriages.push({
            id: `marriage-${Date.now()}`,
            spouse1Id: existingParentId,
            spouse2Id: newId,
            marriageDate: personData.marriageDate || '',
            location: blankPlace,
            childrenIds: [related.id],
            rank: nextMarriages.filter((marriage) => marriage.spouse1Id === existingParentId).length + 1,
          });
        }
      }

      nextPeople.push(created);
      await persist(nextPeople, nextMarriages);
      setIsPersonFormModalOpen(false);
      setSelectedPersonForEdit(null);
      setRelatedPersonForAdd(null);
      setAddRelationshipType(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Une erreur inconnue est survenue.');
    }
  };

  const handleDeletePerson = (personId: string) => {
    setDeletePersonId(personId);
    setDeleteCascade(false);
  };

  const confirmDeletePerson = async () => {
    if (!deletePersonId) return;
    const ids = new Set([deletePersonId, ...(deleteCascade ? descendantIds(deletePersonId, familyData) : [])]);
    setDeleteBusy(true);
    setDeletingPersonIds([...ids]);
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    try {
      const nextPeople = familyData
        .filter((person) => !ids.has(person.id))
        .map((person) => ({
          ...person,
          parentIds: person.parentIds.filter((id) => !ids.has(id)),
          childrenIds: person.childrenIds.filter((id) => !ids.has(id)),
          spouseIds: person.spouseIds.filter((id) => !ids.has(id)),
          siblingIds: person.siblingIds?.filter((id) => !ids.has(id)) || [],
        }));
      const nextMarriages = marriagesData
        .filter((marriage) => !ids.has(marriage.spouse1Id) && !ids.has(marriage.spouse2Id))
        .map((marriage) => ({ ...marriage, childrenIds: (marriage.childrenIds ?? []).filter((id) => !ids.has(id)) }));
      await saveFamily(nextPeople, nextMarriages);
      setFamilyData(nextPeople);
      setMarriagesData(nextMarriages);
      if (ids.has(treeOptions.focusPersonId)) {
        const newFocusPerson = nextPeople[0]?.id;
        if (newFocusPerson) handleFocusPersonChange(newFocusPerson);
      }
      setSelectedPerson(null);
      setDeletePersonId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue lors de la suppression.');
    } finally {
      setDeletingPersonIds([]);
      setDeleteBusy(false);
    }
  };

  const handleResetTree = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'arbre à l'état initial ? Toutes les modifications seront perdues.")) {
      try {
        await applyExample(exampleId);
        alert("Arbre réinitialisé avec succès.");
      } catch (err) {
        console.error("Error resetting data:", err);
        alert("Erreur lors de la réinitialisation de l'arbre.");
      }
    }
  };

  const toggleShareModal = () => {
    setIsShareModalOpen(!isShareModalOpen);
  };

  const toggleEditMode = () => {
    setIsEditMode(prev => {
      if (prev === true) {
        setIsPersonFormModalOpen(false);
        setSelectedPersonForEdit(null);
        setRelatedPersonForAdd(null);
        setAddRelationshipType(null);
      }
      return !prev;
    });
  };

  const handleExportPDF = () => {
    if (!displayFamilyData.length) return;
    setPdfInitialSvg(treeContainerRef.current?.querySelector('[data-tree-canvas] > svg')?.outerHTML ?? '');
    setPdfStudioOpen(true);
  };

  const downloadCustomizedPdf = async (design: PdfDesignOptions) => {
    try {
      const { exportFamilyPdf } = await import('../services/familyPdf');
      await exportFamilyPdf(displayFamilyData, marriagesData, treeOptions.generations, design);
    } catch (exportError) {
      window.alert(exportError instanceof Error ? exportError.message : 'Impossible de générer le PDF.');
    }
  };

  const handleExportTree = () => {
    const blob = new Blob([serializeFamilyArchive(familyData, marriagesData, treeOptions)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arbre-geneatree-${new Date().toISOString().slice(0, 10)}.geneatree.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTree = async (file: File) => {
    try {
      const archive = parseFamilyArchive(await file.text());
      setPendingImport({ fileName: file.name, archive });
    } catch (importError) {
      setPendingImport({ fileName: file.name, error: importError instanceof Error ? importError.message : 'Impossible d’importer cette archive.' });
    }
  };

  const confirmImportTree = async () => {
    if (!pendingImport?.archive) return;
    setImportBusy(true);
    try {
      const archive = pendingImport.archive;
      await saveFamily(archive.persons, archive.marriages);
      applySnapshot(archive.persons, archive.marriages, archive.view.focusPersonId);
      setTreeOptions(archive.view);
      setExampleId('imported');
      localStorage.setItem('geneatree.example', 'imported');
      setPendingImport(null);
    } finally { setImportBusy(false); }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-lg text-zinc-700 dark:text-zinc-300">
        <div className="w-8 h-8 mb-4 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
        Chargement de l'arbre généalogique...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-lg text-red-600">
        <div className="mb-4 text-6xl">⚠️</div>
        <div className="text-center">
          <p className="mb-4">Erreur: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  const displayFamilyData = familyData.length > 0 ? familyData : [];

  const profilePerson = displayFamilyData.find((person) => person.id === profileId) ?? null;

  return (
    <div id="demo" className="relative flex h-full min-h-0 overflow-hidden bg-[#f4f1ea] dark:bg-[#09090b]">
      {narrow && sidebarOpen && (
        <button
          type="button"
          className="absolute inset-0 z-40 bg-zinc-950/45"
          aria-label="Fermer la colonne"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={narrow ? 'contents' : 'relative flex shrink-0'}>
        <aside aria-hidden={narrow && !sidebarOpen} className={`overflow-hidden border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/85 ${narrow && !sidebarOpen ? 'pointer-events-none' : ''} ${
          narrow
            ? `absolute inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-3rem))] border-r shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `h-full border-r transition-[width] duration-300 ${sidebarOpen ? 'w-64' : 'w-14'}`
        }`}>
          <div className={`relative flex h-full flex-col overflow-y-auto overscroll-contain ${narrow || sidebarOpen ? 'w-full' : 'w-14'}`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_68%)]" />
            {narrow && (
              <div className="relative flex items-center justify-between px-3 pt-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">Réglages</p>
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800" aria-label="Fermer les réglages">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="relative">
              <DemoControls
                viewType={treeOptions.viewType}
                generations={treeOptions.generations}
                focusPerson={treeOptions.focusPersonId}
                isEditMode={isEditMode}
                familyData={displayFamilyData}
                exampleId={exampleId}
                onExampleChange={(id) => { void applyExample(id); }}
                onViewTypeChange={handleViewTypeChange}
                onGenerationsChange={handleGenerationsChange}
                onFocusPersonChange={handleFocusPersonChange}
                onExportPDF={handleExportPDF}
                onExportTree={handleExportTree}
                onImportTree={(file) => { void handleImportTree(file); }}
                onShare={toggleShareModal}
                onToggleEditMode={toggleEditMode}
                onResetTree={handleResetTree}
                compact={!narrow && !sidebarOpen}
              />
              {(narrow || sidebarOpen) && (
                <div className="px-3 pb-4">
                  <FamilyStats familyData={displayFamilyData} compact />
                </div>
              )}
            </div>
          </div>
        </aside>
        {!narrow && (
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="absolute top-16 -right-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label={sidebarOpen ? 'Replier la colonne' : 'Ouvrir la colonne'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>
      <div className="relative min-h-0 min-w-0 flex-1" ref={treeContainerRef}>
        <Link
          to="/assistant?from=demo"
          data-print-control
          className="absolute right-3 top-3 z-30 inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white/90 px-3 py-2 text-[13px] font-medium text-primary-800 shadow-md backdrop-blur hover:bg-primary-50 dark:border-primary-400/30 dark:bg-zinc-950/90 dark:text-primary-200 dark:hover:bg-zinc-900"
          title="Ouvrir l’assistant sans perdre cet arbre"
        >
          <Bot size={16} />
          <span className="hidden sm:inline">Assistant</span>
        </Link>
        {narrow && !sidebarOpen && (
          <button
            type="button"
            data-print-control
            onClick={() => setSidebarOpen(true)}
            className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-3 z-30 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-[13px] font-medium text-zinc-800 shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/90 dark:text-zinc-100"
          >
            <PanelLeft size={16} />
            Réglages
          </button>
        )}
        {displayFamilyData.length > 0 && treeOptions.focusPersonId ? (
          <TreeVisualization
            viewType={treeOptions.viewType}
            generations={treeOptions.generations}
            focusPerson={treeOptions.focusPersonId}
            familyData={displayFamilyData}
            marriagesData={marriagesData}
            isEditMode={isEditMode}
            onPersonSelect={handlePersonSelect}
            onAddPersonClick={handleAddPersonClick}
            onDeletePerson={handleDeletePerson}
            deletingPersonIds={deletingPersonIds}
            onPersonHover={(person, rect) => openProfile(person, rect)}
            onPersonHoverEnd={releaseProfile}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Choisissez un exemple dans la colonne.
          </div>
        )}
      </div>
      {profilePerson && profileAnchor && (
        <PersonProfileCard
          person={profilePerson}
          anchor={profileAnchor}
          familyData={displayFamilyData}
          leaving={profileLeaving}
          onClose={beginCloseProfile}
          onExited={finishCloseProfile}
          onEnter={holdProfile}
          onLeave={releaseProfile}
          onPersonUpdate={handleSavePerson}
          onEdit={handleEditPerson}
          onAddPerson={handleAddPersonClick}
          onDeletePerson={handleDeletePerson}
        />
      )}
      {isShareModalOpen && (
        <ShareModal onClose={toggleShareModal} familyData={displayFamilyData} />
      )}
      {pdfStudioOpen && (
        <PdfExportStudio
          persons={displayFamilyData}
          marriages={marriagesData}
          generations={treeOptions.generations}
          initialSvg={pdfInitialSvg}
          testPreset={import.meta.env.DEV && new URLSearchParams(window.location.search).get('pdfTest') === 'showcase'}
          onClose={() => setPdfStudioOpen(false)}
          onDownload={downloadCustomizedPdf}
        />
      )}
      {pendingImport && <ImportFamilyModal fileName={pendingImport.fileName} archive={pendingImport.archive} error={pendingImport.error} busy={importBusy} onCancel={() => !importBusy && setPendingImport(null)} onConfirm={() => void confirmImportTree()} />}
      {deletePersonId && familyData.find((person) => person.id === deletePersonId) && (
        <DeletePersonModal
          person={familyData.find((person) => person.id === deletePersonId)!}
          descendantCount={descendantIds(deletePersonId, familyData).length}
          isolatedCount={isolatedAfterDeletion(deletePersonId, familyData).length}
          cascade={deleteCascade}
          busy={deleteBusy}
          onCascadeChange={setDeleteCascade}
          onCancel={() => !deleteBusy && setDeletePersonId(null)}
          onConfirm={() => void confirmDeletePerson()}
        />
      )}
      <PersonFormModal
        isOpen={isPersonFormModalOpen}
        onClose={() => setIsPersonFormModalOpen(false)}
        person={selectedPersonForEdit}
        allPersons={displayFamilyData}
        marriages={marriagesData}
        onSave={handleSavePerson}
        relatedPersonId={relatedPersonForAdd || undefined}
        relationshipType={addRelationshipType || undefined}
        selectedPerson={selectedPerson}
        isEditMode={isEditMode}
        onPersonUpdate={handleSavePerson}
        onAddPerson={handleAddPersonClick}
        onDeletePerson={handleDeletePerson}
      />
    </div>
  );
};

export default DemoPage;
