// src/components/DynamicPersonForm.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PartialPerson, Location, Question, FormState } from '../types/family';
import { FaMicrophone, FaVolumeUp } from 'react-icons/fa';

interface DynamicPersonFormProps {
  onSubmit: (personData: PartialPerson) => void;
  onCancel: () => void;
  onNextPerson: (relation: string) => void;
  initialPerson?: PartialPerson;
  relation?: string;
}

const DynamicPersonForm: React.FC<DynamicPersonFormProps> = ({ onSubmit, initialPerson, relation }) => {
  const [formState, setFormState] = useState<FormState>({
    currentStep: 0,
    formData: initialPerson || {},
    questions: [],
    currentPersonRelation: relation,
  });

  const [voiceState, setVoiceState] = useState<{
    isListening: boolean;
    transcript: string;
    isSpeaking: boolean;
  }>({
    isListening: false,
    transcript: '',
    isSpeaking: false,
  });

  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasSpokenInitialQuestion = useRef(false);

  const questions: Question[] = useMemo(() => [
    { id: '1', text: relation === 'vous' ? 'Quel est votre prénom ?' : `Quel est le prénom de ${relation} ?`, type: 'text', field: 'firstName' },
    { id: '2', text: relation === 'vous' ? 'Quel est votre nom de famille ?' : `Quel est le nom de famille de ${relation} ?`, type: 'text', field: 'lastName' },
    { id: '3', text: relation === 'vous' ? 'Quel est votre genre ?' : `Quel est le genre de ${relation} ?`, type: 'select', field: 'gender', options: [
      { value: 'male', label: 'Homme' },
      { value: 'female', label: 'Femme' },
      { value: 'unknown', label: 'Préfère ne pas dire' }
    ]},
    { id: '4', text: relation === 'vous' ? 'Quelle est votre date de naissance ?' : `Quelle est la date de naissance de ${relation} ?`, type: 'date', field: 'birthDate' },
    { id: '5', text: relation === 'vous' ? 'Dans quelle ville êtes-vous né(e) ?' : `Dans quelle ville est né(e) ${relation} ?`, type: 'location', field: 'birthPlace' },
    { id: '6', text: relation === 'vous' ? 'Quelle est votre profession ?' : `Quelle est la profession de ${relation} ?`, type: 'text', field: 'occupation' },
    { id: '7', text: relation === 'vous' ? 'Êtes-vous toujours vivant(e) ?' : `${relation} est-il/elle toujours vivant(e) ?`, type: 'boolean', field: 'deceased', inverse: true },
    { id: '8', text: relation === 'vous' ? 'Quelle est votre date de décès ?' : `Quelle est la date de décès de ${relation} ?`, type: 'date', field: 'deathDate', condition: (formData) => !formData.deceased },
    { id: '9', text: relation === 'vous' ? 'Dans quelle ville êtes-vous décédé(e) ?' : `Dans quelle ville est décédé(e) ${relation} ?`, type: 'location', field: 'deathPlace', condition: (formData) => !formData.deceased },
  ], [relation]);

  useEffect(() => {
    const filteredQuestions = questions.filter(q => !q.condition || q.condition(formState.formData));
    setFormState(prev => ({
      ...prev,
      questions: filteredQuestions,
    }));
  }, [formState.formData, questions]);

  useEffect(() => {
    speechSynthesisRef.current = window.speechSynthesis;
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (formState.questions.length > 0 && !hasSpokenInitialQuestion.current) {
      speakQuestion(formState.questions[formState.currentStep].text);
      hasSpokenInitialQuestion.current = true;
    }
  }, [formState.currentStep, formState.questions]);

  const speakQuestion = (text: string) => {
    if (!speechSynthesisRef.current) return;
    if (utteranceRef.current) {
      speechSynthesisRef.current.cancel();
    }
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = 'fr-FR';
    utteranceRef.current.onstart = () => setVoiceState(prev => ({ ...prev, isSpeaking: true }));
    utteranceRef.current.onend = () => setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    speechSynthesisRef.current.speak(utteranceRef.current);
  };

  const replayQuestion = () => {
    const currentText = formState.questions[formState.currentStep]?.text;
    if (currentText) {
      speakQuestion(currentText);
    }
  };

  const handleInputChange = (value: string | boolean | Location) => {
    const { field, inverse } = formState.questions[formState.currentStep];
    if (!field) return;
    let processedValue = value;
    if (inverse && typeof value === 'boolean') {
      processedValue = !value;
    }
    setFormState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: processedValue,
      },
    }));
  };

  const handleNext = () => {
    if (formState.currentStep < formState.questions.length - 1) {
      hasSpokenInitialQuestion.current = false;
      setFormState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      onSubmit(formState.formData);
    }
  };

  const handlePrevious = () => {
    if (formState.currentStep > 0) {
      hasSpokenInitialQuestion.current = false;
      setFormState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('La reconnaissance vocale n\'est pas supportée dans ce navigateur.');
      return;
    }
    setVoiceState(prev => ({ ...prev, isListening: true, transcript: '' }));
    const recognitionConstructor = window.SpeechRecognition || (
      window as Window & { webkitSpeechRecognition: typeof SpeechRecognition }
    ).webkitSpeechRecognition;
    const recognition = new recognitionConstructor();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setVoiceState(prev => ({ ...prev, transcript }));
      if (formState.questions[formState.currentStep].type === 'boolean') {
        const isAffirmative = transcript.toLowerCase().includes('oui');
        handleInputChange(isAffirmative);
      } else {
        handleInputChange(transcript);
      }
      setVoiceState(prev => ({ ...prev, isListening: false }));
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Erreur de reconnaissance vocale', event.error);
      setVoiceState(prev => ({ ...prev, isListening: false }));
    };
    recognition.start();
  };

  const currentQuestion = formState.questions[formState.currentStep];
  if (!currentQuestion) {
    return <div>Erreur: Question non trouvée.</div>;
  }

  return (
    <div className="max-w-md p-4 mx-auto bg-white rounded-lg shadow">
      <div className="flex items-center mb-4">
        <p className="flex-grow text-lg font-semibold">{currentQuestion.text}</p>
        <button
          onClick={replayQuestion}
          disabled={voiceState.isSpeaking}
          className={`ml-2 p-2 rounded-full ${voiceState.isSpeaking ? 'bg-gray-300' : 'bg-blue-100 hover:bg-blue-200'}`}
          title="Réécouter la question"
        >
          <FaVolumeUp className="text-blue-600" />
        </button>
      </div>
      <div className="mb-4">
        {currentQuestion.type === 'text' && (
          <input
            type="text"
            value={formState.formData[currentQuestion.field] as string || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}
        {currentQuestion.type === 'select' && (
          <select
            value={formState.formData[currentQuestion.field] as string || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {currentQuestion.options?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
        {currentQuestion.type === 'date' && (
          <input
            type="date"
            value={formState.formData[currentQuestion.field] as string || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}
        {currentQuestion.type === 'location' && (
          <div>
            <input
              type="text"
              placeholder="Ville"
              value={(formState.formData[currentQuestion.field] as Location)?.city || ''}
              onChange={(e) => handleInputChange({
                ...(formState.formData[currentQuestion.field] as Location || {}),
                city: e.target.value,
              })}
              className="w-full p-2 mb-2 border rounded"
            />
            <input
              type="text"
              placeholder="Pays"
              value={(formState.formData[currentQuestion.field] as Location)?.country || ''}
              onChange={(e) => handleInputChange({
                ...(formState.formData[currentQuestion.field] as Location || {}),
                country: e.target.value,
              })}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
        {currentQuestion.type === 'boolean' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={!!formState.formData[currentQuestion.field]}
              onChange={(e) => handleInputChange(e.target.checked)}
              className="mr-2"
            />
            <span>{formState.formData[currentQuestion.field] ? 'Oui' : 'Non'}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={formState.currentStep === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          onClick={voiceState.isListening ? () => {} : startListening}
          className={`px-4 py-2 mr-2 flex items-center justify-center ${voiceState.isListening ? 'bg-red-500' : 'bg-blue-500'} text-white rounded`}
        >
          <FaMicrophone className="mr-2" />
          {voiceState.isListening ? 'Écoute en cours...' : 'Répondre vocalement'}
        </button>
        <button
          onClick={handleNext}
          disabled={!formState.formData[currentQuestion.field] && formState.formData[currentQuestion.field] !== false}
          className="px-4 py-2 text-white bg-green-500 rounded disabled:opacity-50"
        >
          {formState.currentStep === formState.questions.length - 1 ? 'Terminer' : 'Suivant'}
        </button>
      </div>
    </div>
  );
};

export default DynamicPersonForm;
