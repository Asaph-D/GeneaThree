import React, { useRef } from 'react';
import { User, Edit, Plus, Trash2, Heart, Baby, Users, Phone, Mail, MapPin, Calendar, Briefcase, Camera } from 'lucide-react';
import { Location, Person } from '../../types/family';

export interface PersonInfoPanelProps {
  selectedPerson: Person | null;
  onPersonUpdate: (person: Person) => Promise<void>;
  onEdit: (person: Person) => void;
  onAddPerson: (relatedPersonId: string, relationshipType: "child" | "parent" | "spouse") => void;
  onDeletePerson: (personId: string) => Promise<void>;
  familyData: Person[];
}

const PersonInfoPanel: React.FC<PersonInfoPanelProps> = ({
  selectedPerson,
  onPersonUpdate,
  onEdit,
  onAddPerson,
  onDeletePerson,
  familyData
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedPerson) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 1_500_000) {
      window.alert('Choisissez une image de moins de 1,5 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      void onPersonUpdate({ ...selectedPerson, photoUrl: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
  };
  // Fonction pour trouver une personne par ID
  const findPersonById = (id: string): Person | undefined => {
    return familyData.find(p => p.id === id);
  };

  // Fonction pour calculer l'âge
  const calculateAge = (birthDate: string, deathDate?: string): string => {
    if (!birthDate) return 'Inconnu';
    
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    
    if (deathDate) {
      return `${age} ans (décédé${selectedPerson?.gender === 'female' ? 'e' : ''})`;
    }
    return `${age} ans`;
  };

  // Fonction pour formater une date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Non renseignée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fonction pour formater un lieu
  const formatLocation = (location: Location | string | undefined): string => {
    if (!location) return 'Non renseigné';
    if (typeof location === 'string') return location;
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Non renseigné';
  };

  if (!selectedPerson) {
    return (
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Informations sur la personne sélectionnée
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm min-h-[300px] flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aucune personne sélectionnée</p>
            <p className="text-sm">Cliquez sur une personne dans l'arbre pour afficher ses informations</p>
          </div>
        </div>
      </div>
    );
  }

  // Déterminer l'icône de genre et les couleurs
  const getGenderStyles = () => {
    switch (selectedPerson.gender) {
      case 'male':
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          iconColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-200 dark:border-blue-700'
        };
      case 'female':
        return {
          bgColor: 'bg-pink-100 dark:bg-pink-900',
          iconColor: 'text-pink-600 dark:text-pink-400',
          borderColor: 'border-pink-200 dark:border-pink-700'
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          iconColor: 'text-gray-600 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-600'
        };
    }
  };

  const genderStyles = getGenderStyles();

  // Rendre les parents
  const renderParents = () => {
    if (!selectedPerson.parentIds || selectedPerson.parentIds.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-blue-500" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300">
              Parents ({selectedPerson.parentIds.length})
            </h4>
          </div>
          <button
            onClick={() => onAddPerson(selectedPerson.id, 'parent')}
            className="flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {selectedPerson.parentIds.map((parentId) => {
            const parent = findPersonById(parentId);
            return (
              <div key={parentId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg dark:bg-gray-600 dark:border-gray-500">
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-full ${parent?.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900' : parent?.gender === 'female' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <User className={`w-3 h-3 ${parent?.gender === 'male' ? 'text-blue-600 dark:text-blue-400' : parent?.gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {parent ? `${parent.firstName} ${parent.lastName}` : 'Personne non trouvée'}
                    </p>
                    {parent && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {parent.birthDate && `Né${parent.gender === 'female' ? 'e' : ''} en ${new Date(parent.birthDate).getFullYear()}`}
                        {parent.occupation && ` • ${parent.occupation}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Rendre les conjoints
  const renderSpouses = () => {
    if (!selectedPerson.spouseIds || selectedPerson.spouseIds.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Heart className="w-4 h-4 mr-2 text-red-500" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300">
              Conjoint{selectedPerson.spouseIds.length > 1 ? 's' : ''} ({selectedPerson.spouseIds.length})
            </h4>
          </div>
          <button
            onClick={() => onAddPerson(selectedPerson.id, 'spouse')}
            className="flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {selectedPerson.spouseIds.map((spouseId) => {
            const spouse = findPersonById(spouseId);
            return (
              <div key={spouseId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg dark:bg-gray-600 dark:border-gray-500">
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-full ${spouse?.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900' : spouse?.gender === 'female' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Heart className="w-3 h-3 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {spouse ? `${spouse.firstName} ${spouse.lastName}` : 'Personne non trouvée'}
                    </p>
                    {spouse && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {spouse.birthDate && `Né${spouse.gender === 'female' ? 'e' : ''} en ${new Date(spouse.birthDate).getFullYear()}`}
                        {spouse.occupation && ` • ${spouse.occupation}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Rendre les enfants
  const renderChildren = () => {
    if (!selectedPerson.childrenIds || selectedPerson.childrenIds.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Baby className="w-4 h-4 mr-2 text-green-500" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300">
              Enfants ({selectedPerson.childrenIds.length})
            </h4>
          </div>
          <button
            onClick={() => onAddPerson(selectedPerson.id, 'child')}
            className="flex items-center px-2 py-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {selectedPerson.childrenIds.map((childId) => {
            const child = findPersonById(childId);
            return (
              <div key={childId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg dark:bg-gray-600 dark:border-gray-500">
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-full ${child?.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900' : child?.gender === 'female' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Baby className="w-3 h-3 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {child ? `${child.firstName} ${child.lastName}` : 'Personne non trouvée'}
                    </p>
                    {child && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {child.birthDate && `Né${child.gender === 'female' ? 'e' : ''} en ${new Date(child.birthDate).getFullYear()}`}
                        {child.occupation && ` • ${child.occupation}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Rendre les frères et sœurs
  const renderSiblings = () => {
    if (!selectedPerson.siblingIds || selectedPerson.siblingIds.length === 0) return null;

    return (
      <div className="mt-6">
        <div className="flex items-center mb-3">
          <Users className="w-4 h-4 mr-2 text-purple-500" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300">
            Frères et sœurs ({selectedPerson.siblingIds.length})
          </h4>
        </div>
        <div className="space-y-2">
          {selectedPerson.siblingIds.map((siblingId) => {
            const sibling = findPersonById(siblingId);
            return (
              <div key={siblingId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg dark:bg-gray-600 dark:border-gray-500">
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-full ${sibling?.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900' : sibling?.gender === 'female' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Users className="w-3 h-3 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {sibling ? `${sibling.firstName} ${sibling.lastName}` : 'Personne non trouvée'}
                    </p>
                    {sibling && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sibling.birthDate && `Né${sibling.gender === 'female' ? 'e' : ''} en ${new Date(sibling.birthDate).getFullYear()}`}
                        {sibling.occupation && ` • ${sibling.occupation}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3 className="sr-only">Informations détaillées</h3>
      <div>
        {/* En-tête avec photo/avatar et informations principales */}
        <div className="flex items-start mb-6">
          <div className="relative flex-shrink-0">
            {selectedPerson.photoUrl ? (
              <img
                src={selectedPerson.photoUrl}
                alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`}
                className={`w-20 h-20 rounded-full object-cover border-2 ${genderStyles.borderColor}`}
              />
            ) : (
              <div className={`flex items-center justify-center w-20 h-20 rounded-full ${genderStyles.bgColor} border-2 ${genderStyles.borderColor}`}>
                <User className={`w-10 h-10 ${genderStyles.iconColor}`} />
              </div>
            )}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-zinc-950 text-white shadow-md hover:bg-zinc-800 dark:border-zinc-800"
              title="Mettre à jour la photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-serif text-3xl font-medium text-zinc-950 dark:text-white">
                  {selectedPerson.firstName} {selectedPerson.lastName}
                </h3>
                {selectedPerson.occupation && (
                  <div className="flex items-center mt-1">
                    <Briefcase className="w-4 h-4 mr-1 text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedPerson.occupation}
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedPerson.gender === 'male' ? 'Homme' : 
                   selectedPerson.gender === 'female' ? 'Femme' : 'Genre non spécifié'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(selectedPerson)}
                  className="flex items-center px-3 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-200 rounded-md hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900"
                  title="Modifier cette personne"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => onDeletePerson(selectedPerson.id)}
                  className="flex items-center px-3 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 rounded-md hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900"
                  title="Supprimer cette personne"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Informations vitales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white dark:bg-gray-600 rounded-lg">
          <div>
            <div className="flex items-center mb-1">
              <Calendar className="w-4 h-4 mr-1 text-green-500" />
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Naissance
              </h4>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-300">
              {selectedPerson.birthDate ? (
                <>
                  {formatDate(selectedPerson.birthDate)}
                  <br />
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {formatLocation(selectedPerson.birthPlace)}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 italic">Non renseignée</span>
              )}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Âge
            </h4>
            <p className="text-sm text-gray-900 dark:text-gray-300">
              {calculateAge(selectedPerson.birthDate, selectedPerson.deathDate)}
            </p>
          </div>

          {selectedPerson.deceased && (
            <div className="md:col-span-2">
              <div className="flex items-center mb-1">
                <Calendar className="w-4 h-4 mr-1 text-red-500" />
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Décès
                </h4>
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-300">
                {selectedPerson.deathDate ? (
                  <>
                    {formatDate(selectedPerson.deathDate)}
                    <br />
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {formatLocation(selectedPerson.deathPlace)}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 italic">Date non renseignée</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Biographie si disponible */}
        {selectedPerson.biography && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Biographie
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 p-4 rounded-lg leading-relaxed">
              {selectedPerson.biography}
            </p>
          </div>
        )}

        {/* Relations familiales */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Relations familiales
          </h4>

          {/* Boutons d'ajout rapide */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => onAddPerson(selectedPerson.id, 'parent')}
              className="flex items-center px-3 py-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-200 rounded-full hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter un parent
            </button>
            <button
              onClick={() => onAddPerson(selectedPerson.id, 'spouse')}
              className="flex items-center px-3 py-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 rounded-full hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter un conjoint
            </button>
            <button
              onClick={() => onAddPerson(selectedPerson.id, 'child')}
              className="flex items-center px-3 py-2 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 border border-green-200 rounded-full hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Ajouter un enfant
            </button>
          </div>

          {renderParents()}
          {renderSpouses()}
          {renderChildren()}
          {renderSiblings()}

          {/* Message si aucune relation */}
          {(!selectedPerson.parentIds || selectedPerson.parentIds.length === 0) &&
           (!selectedPerson.spouseIds || selectedPerson.spouseIds.length === 0) &&
           (!selectedPerson.childrenIds || selectedPerson.childrenIds.length === 0) &&
           (!selectedPerson.siblingIds || selectedPerson.siblingIds.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">Aucune relation familiale enregistrée</p>
              <p className="text-xs">Utilisez les boutons ci-dessus pour ajouter des membres de la famille</p>
            </div>
          )}
        </div>

        {/* Notes si disponibles */}
        {selectedPerson.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Notes
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-400">
              {selectedPerson.notes}
            </p>
          </div>
        )}

        {/* Contact si disponible */}
        {selectedPerson.contact && (selectedPerson.contact.email || selectedPerson.contact.phone) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Informations de contact
            </h4>
            <div className="space-y-2 bg-white dark:bg-gray-600 p-4 rounded-lg">
              {selectedPerson.contact.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedPerson.contact.email}
                  </span>
                </div>
              )}
              {selectedPerson.contact.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedPerson.contact.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Résumé familial
          </h4>
          <div className="grid grid-cols-4 gap-4 text-center bg-white dark:bg-gray-600 p-4 rounded-lg">
            <div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {(selectedPerson.parentIds?.length || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Parents</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {(selectedPerson.spouseIds?.length || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Conjoints</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {(selectedPerson.childrenIds?.length || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enfants</p>
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {(selectedPerson.siblingIds?.length || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fratrie</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonInfoPanel;
