/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trophy, 
  Heart, 
  RotateCcw, 
  Play, 
  BookOpen, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Sparkles,
  HelpCircle,
  BarChart3,
  Award,
  User,
  ArrowLeft,
  Lock,
  Star
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DeterminerType, GameState, DeterminerExample, UserProgress, Badge } from './types';
import { DETERMINER_EXAMPLES, DETERMINER_TYPES_INFO } from './data/determinantes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const INITIAL_BADGES: Badge[] = [
  { id: 'art-master', name: 'Maestro de Artículos', description: 'Acierta 5 artículos', icon: '🔍', unlocked: false, category: 'artículo' },
  { id: 'dem-expert', name: 'Experto en Demostrativos', description: 'Acierta 5 demostrativos', icon: '📍', unlocked: false, category: 'demostrativo' },
  { id: 'pos-genius', name: 'Genio de Posesivos', description: 'Acierta 5 posesivos', icon: '🏠', unlocked: false, category: 'posesivo' },
  { id: 'num-wizard', name: 'Mago de Numerales', description: 'Acierta 5 numerales', icon: '🔢', unlocked: false, category: 'numeral' },
  { id: 'ind-sage', name: 'Sabio de Indefinidos', description: 'Acierta 5 indefinidos', icon: '☁️', unlocked: false, category: 'indefinido' },
  { id: 'rookie', name: 'Detective Novato', description: 'Consigue 100 puntos', icon: '🕵️', unlocked: false, category: 'general' },
  { id: 'pro', name: 'Super Detective', description: 'Consigue 500 puntos', icon: '🌟', unlocked: false, category: 'general' },
  { id: 'perfect', name: 'Misión Perfecta', description: 'Gana sin perder vidas', icon: '💎', unlocked: false, category: 'general' },
];

const INITIAL_PROGRESS: UserProgress = {
  totalPoints: 0,
  stats: {
    artículo: { correct: 0, total: 0 },
    demostrativo: { correct: 0, total: 0 },
    posesivo: { correct: 0, total: 0 },
    numeral: { correct: 0, total: 0 },
    indefinido: { correct: 0, total: 0 },
  },
  badges: INITIAL_BADGES,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    currentLevel: 0,
    lives: 3,
    phase: 'start'
  });

  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('detective_progress');
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });

  useEffect(() => {
    localStorage.setItem('detective_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  const [currentQuestion, setCurrentQuestion] = useState<DeterminerExample | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Shuffle questions
  const questions = useMemo(() => {
    return [...DETERMINER_EXAMPLES].sort(() => Math.random() - 0.5);
  }, [gameState.phase === 'start']);

  useEffect(() => {
    if (gameState.phase === 'playing' && !currentQuestion) {
      nextQuestion();
    }
  }, [gameState.phase, currentQuestion]);

  const nextQuestion = () => {
    if (gameState.currentLevel >= questions.length) {
      setGameState(prev => ({ ...prev, phase: 'won' }));
      
      // Check for "Perfect" badge
      if (gameState.lives === 3) {
        setUserProgress(prev => ({
          ...prev,
          badges: prev.badges.map(b => b.id === 'perfect' ? { ...b, unlocked: true } : b)
        }));
      }
      return;
    }
    setCurrentQuestion(questions[gameState.currentLevel]);
    setFeedback(null);
    setAiExplanation(null);
  };

  const handleAnswer = (selectedType: DeterminerType) => {
    if (!currentQuestion || feedback) return;

    const isCorrect = selectedType === currentQuestion.type;
    
    // Update progress
    setUserProgress(prev => {
      const newStats = { ...prev.stats };
      newStats[currentQuestion.type] = {
        correct: newStats[currentQuestion.type].correct + (isCorrect ? 1 : 0),
        total: newStats[currentQuestion.type].total + 1
      };

      let newPoints = prev.totalPoints + (isCorrect ? 10 : 0);
      
      // Check for new badges
      const newBadges = prev.badges.map(badge => {
        if (badge.unlocked) return badge;
        
        let shouldUnlock = false;
        if (badge.category !== 'general' && badge.category === currentQuestion.type) {
          if (newStats[badge.category].correct >= 5) shouldUnlock = true;
        } else if (badge.id === 'rookie' && newPoints >= 100) {
          shouldUnlock = true;
        } else if (badge.id === 'pro' && newPoints >= 500) {
          shouldUnlock = true;
        }

        return shouldUnlock ? { ...badge, unlocked: true } : badge;
      });

      return {
        ...prev,
        totalPoints: newPoints,
        stats: newStats,
        badges: newBadges
      };
    });

    if (isCorrect) {
      setGameState(prev => ({ ...prev, score: prev.score + 10 }));
      setFeedback({ isCorrect: true, message: '¡Excelente! Has acertado.' });
    } else {
      setGameState(prev => ({ ...prev, lives: prev.lives - 1 }));
      setFeedback({ 
        isCorrect: false, 
        message: `¡Oh no! "${currentQuestion.word}" es un ${currentQuestion.type}.` 
      });
      
      if (gameState.lives <= 1) {
        setTimeout(() => setGameState(prev => ({ ...prev, phase: 'gameover' })), 1500);
      }
    }
  };

  const askAi = async () => {
    if (!currentQuestion) return;
    setIsAiLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explícale a un niño de 9 años por qué la palabra "${currentQuestion.word}" en la frase "${currentQuestion.sentence}" es un determinante de tipo ${currentQuestion.type}. Sé amable y usa un lenguaje sencillo.`,
      });
      setAiExplanation(response.text || "No he podido obtener una explicación ahora mismo.");
    } catch (error) {
      setAiExplanation("El profesor está ocupado, ¡inténtalo más tarde!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const startGame = () => {
    setGameState({
      score: 0,
      currentLevel: 0,
      lives: 3,
      phase: 'playing'
    });
    setCurrentQuestion(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-soft-bg overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState.phase === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full bg-white rounded-3xl p-8 card-shadow border-4 border-primary/20 text-center"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Detective de Determinantes</h1>
            <p className="text-slate-600 mb-8 text-lg">
              ¡Hola, recluta! Necesitamos tu ayuda para clasificar estas palabras. ¿Estás listo para la misión?
            </p>
            <div className="space-y-4">
              <button 
                onClick={startGame}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 button-bounce"
              >
                <Play className="w-6 h-6 fill-current" />
                ¡Empezar Misión!
              </button>
              
              <button 
                onClick={() => setGameState(prev => ({ ...prev, phase: 'stats' }))}
                className="w-full py-4 bg-white text-slate-700 rounded-2xl font-bold text-xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-6 h-6" />
                Mi Progreso
              </button>

              <div className="flex justify-center gap-4 pt-4">
                {Object.entries(DETERMINER_TYPES_INFO).map(([type, info]) => (
                  <div key={type} title={type} className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl", info.color)}>
                    {info.icon}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState.phase === 'playing' && currentQuestion && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-2xl w-full"
          >
            {/* HUD */}
            <div className="flex justify-between items-center mb-6 px-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full card-shadow border-2 border-slate-100">
                <Trophy className="w-5 h-5 text-accent fill-accent" />
                <span className="font-bold text-slate-700">{gameState.score}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={cn(
                      "w-6 h-6 transition-all", 
                      i < gameState.lives ? "text-primary fill-primary" : "text-slate-200"
                    )} 
                  />
                ))}
              </div>
              <div className="bg-white px-4 py-2 rounded-full card-shadow border-2 border-slate-100 font-bold text-slate-500">
                {gameState.currentLevel + 1} / {questions.length}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-3xl p-8 card-shadow border-4 border-secondary/20 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-secondary" />
              </div>
              
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold mb-2">Clasifica la palabra:</p>
              <h2 className="text-5xl font-bold text-slate-800 mb-6 flex items-center gap-4">
                <span className="bg-secondary/10 px-4 py-1 rounded-xl text-secondary">
                  {currentQuestion.word}
                </span>
              </h2>
              
              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 mb-8">
                <p className="text-xl text-slate-700 italic leading-relaxed">
                  "{currentQuestion.sentence.split(currentQuestion.word).map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && <span className="text-primary font-bold underline decoration-wavy underline-offset-4">{currentQuestion.word}</span>}
                    </React.Fragment>
                  ))}"
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(DETERMINER_TYPES_INFO) as DeterminerType[]).map((type) => (
                  <button
                    key={type}
                    disabled={!!feedback}
                    onClick={() => handleAnswer(type)}
                    className={cn(
                      "p-4 rounded-2xl font-bold text-lg transition-all border-b-4 flex items-center justify-between group relative overflow-hidden",
                      feedback && type === currentQuestion.type ? "bg-green-500 text-white border-green-700" : 
                      feedback && type !== currentQuestion.type ? "bg-slate-100 text-slate-400 border-slate-200 opacity-50" :
                      "bg-white text-slate-700 border-slate-200 hover:border-secondary hover:bg-secondary/5"
                    )}
                  >
                    <span className="capitalize">{type}</span>
                    <span className="text-2xl group-hover:scale-125 transition-transform">
                      {DETERMINER_TYPES_INFO[type].icon}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback & AI */}
            <AnimatePresence shadow-none>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-6 rounded-3xl card-shadow border-4 flex flex-col gap-4",
                    feedback.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                      <div>
                        <p className={cn("font-bold text-xl", feedback.isCorrect ? "text-green-700" : "text-red-700")}>
                          {feedback.message}
                        </p>
                        <p className="text-slate-600">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setGameState(prev => ({ ...prev, currentLevel: prev.currentLevel + 1 }));
                        nextQuestion();
                      }}
                      className="bg-white p-3 rounded-full border-2 border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <ChevronRight className="w-6 h-6 text-slate-600" />
                    </button>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    {!aiExplanation ? (
                      <button 
                        onClick={askAi}
                        disabled={isAiLoading}
                        className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50"
                      >
                        <HelpCircle className="w-4 h-4" />
                        {isAiLoading ? 'Pensando...' : '¿Por qué? Pregunta al Profesor IA'}
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 italic border border-secondary/20"
                      >
                        <p className="font-bold text-secondary mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> El Profesor dice:
                        </p>
                        {aiExplanation}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {(gameState.phase === 'gameover' || gameState.phase === 'won') && (
          <motion.div
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-3xl p-8 card-shadow border-4 border-slate-200 text-center"
          >
            {gameState.phase === 'won' ? (
              <>
                <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12 text-accent fill-accent" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Misión Cumplida!</h2>
                <p className="text-slate-600 mb-6">Eres un experto detective de determinantes.</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RotateCcw className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">¡Casi lo logras!</h2>
                <p className="text-slate-600 mb-6">Has aprendido mucho hoy. ¿Quieres intentarlo de nuevo?</p>
              </>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl mb-8 flex justify-around items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Puntuación</p>
                <p className="text-3xl font-bold text-primary">{gameState.score}</p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Nivel</p>
                <p className="text-3xl font-bold text-secondary">{gameState.currentLevel}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={startGame}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 button-bounce"
              >
                <RotateCcw className="w-6 h-6" />
                Reintentar
              </button>
              <button 
                onClick={() => setGameState(prev => ({ ...prev, phase: 'stats' }))}
                className="w-full py-4 bg-white text-slate-700 rounded-2xl font-bold text-xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-6 h-6" />
                Ver mi progreso
              </button>
            </div>
          </motion.div>
        )}

        {gameState.phase === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-4xl w-full bg-white rounded-3xl p-8 card-shadow border-4 border-secondary/20"
          >
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setGameState(prev => ({ ...prev, phase: 'start' }))}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <User className="w-8 h-8 text-secondary" />
                Mi Diario de Detective
              </h2>
              <div className="bg-accent/20 px-4 py-2 rounded-full flex items-center gap-2">
                <Star className="w-5 h-5 text-accent fill-accent" />
                <span className="font-bold text-slate-700">{userProgress.totalPoints} pts</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Stats Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                  Dominio por tipo
                </h3>
                <div className="space-y-4">
                  {(Object.keys(DETERMINER_TYPES_INFO) as DeterminerType[]).map(type => {
                    const stats = userProgress.stats[type];
                    const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                    const info = DETERMINER_TYPES_INFO[type];
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{info.icon}</span>
                            <span className="font-bold text-slate-600 capitalize">{type}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-400">{stats.correct}/{stats.total} aciertos</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={cn("h-full transition-all", info.color)}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Aprendiz</span>
                          <span>{percentage}% Dominado</span>
                          <span>Maestro</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Badges Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Mis Insignias
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {userProgress.badges.map(badge => (
                    <div 
                      key={badge.id}
                      className={cn(
                        "p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition-all",
                        badge.unlocked 
                          ? "bg-white border-accent/30 card-shadow" 
                          : "bg-slate-50 border-slate-100 opacity-60 grayscale"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1",
                        badge.unlocked ? "bg-accent/20" : "bg-slate-200"
                      )}>
                        {badge.unlocked ? badge.icon : <Lock className="w-6 h-6 text-slate-400" />}
                      </div>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{badge.name}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
              <button 
                onClick={() => setGameState(prev => ({ ...prev, phase: 'start' }))}
                className="px-8 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all button-bounce"
              >
                Volver al Cuartel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="fixed bottom-4 text-slate-400 text-xs flex gap-4">
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          4º Primaria
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          IA Educativa
        </div>
      </div>
    </div>
  );
}
