'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routine, Plan6Months, WorkoutSessionLog, CoachChatMessage } from '@/types/gym';
import { GymStorage } from '@/lib/storage';
import {
  X,
  Send,
  Sparkles,
  Dumbbell,
  Trash2,
  Bot,
  User,
  ArrowRight,
  ShieldAlert,
  Loader2,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface CoachChatModalProps {
  activeRoutine: Routine | null;
  activePlan: Plan6Months | null;
  onClose: () => void;
}

const DEFAULT_PROMPTS = [
  '¿Cómo caliento adecuadamente para mi rutina de hoy?',
  '¿Qué hago si una máquina o banco está ocupado en el gym?',
  'Tengo agujetas fuertes, ¿debo entrenar o descansar?',
  '¿Cómo sé si debo subir peso o repeticiones en mis series?',
  '¿Qué comer antes y después de mi sesión para rendir al máximo?',
];

let messageIdCounter = 0;
function generateUniqueId(prefix: string) {
  messageIdCounter += 1;
  return `${prefix}-${messageIdCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function getCurrentTimeLabel() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export const CoachChatModal: React.FC<CoachChatModalProps> = ({
  activeRoutine,
  activePlan,
  onClose,
}) => {
  const [messages, setMessages] = useState<CoachChatMessage[]>(() => {
    const stored = GymStorage.getCoachChat();
    // Clean out any legacy generic fallback messages that may have been saved
    const validStored = stored.filter(
      (m) => !m.text.includes('fase excéntrica (bajada en 2-3 segundos)') &&
             !m.text.includes('activar la vía mTOR')
    );
    if (validStored.length > 0) return validStored;

    const routineName = activeRoutine?.title || 'tu entrenamiento';
    const goal = activePlan?.profileSnapshot?.goal || activeRoutine?.userProfile?.goal || 'tus objetivos';
    const initialGreeting: CoachChatMessage = {
      id: generateUniqueId('msg-init'),
      sender: 'coach',
      text: activeRoutine
        ? `¡Hola! Soy tu **Coach IA personal**. Estoy conectado a tu rutina **"${routineName}"** y enfocado en tu meta de **${goal}**.\n\nPuedes preguntarme exactamente lo que necesites: dudas sobre cómo ejecutar un ejercicio, cómo sustituir una máquina ocupada, si debes subir peso, qué comer antes o después de entrenar, o pedirme que cambiemos algún ejercicio de tu rutina. ¿Qué duda tienes hoy?`
        : `¡Hola! Soy tu **Coach IA personal** de IronPulse.\n\nEstoy aquí para responder cualquier pregunta que tengas sobre el gimnasio: cómo empezar, dudas sobre ejercicios, técnica, dolor o molestias, nutrición o cómo organizar tu entrenamiento. ¿En qué te puedo ayudar hoy?`,
      timestamp: getCurrentTimeLabel(),
      suggestedFollowUps: [
        '¿Cómo caliento para mi sesión de hoy?',
        '¿Qué hago si una máquina está ocupada?',
        '¿Cómo sé si debo subir peso o repeticiones?',
        '¿Qué debo comer después de entrenar?',
      ],
    };
    GymStorage.saveCoachChat([initialGreeting]);
    return [initialGreeting];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedUpdateNotice, setAppliedUpdateNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');

    const userMsg: CoachChatMessage = {
      id: generateUniqueId('msg-u'),
      sender: 'user',
      text: query,
      timestamp: getCurrentTimeLabel(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    GymStorage.saveCoachChat(updatedMessages);
    setIsLoading(true);

    try {
      // Send chat history without duplicating current message
      const historyForApi = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const res = await fetch('/api/gemini/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: historyForApi,
          activeRoutine,
          activePlan,
          userProfile: activePlan?.profileSnapshot || activeRoutine?.userProfile || null,
          recentLogs: GymStorage.getWorkoutLogs().slice(0, 3),
        }),
      });

      if (!res.ok) throw new Error('Error al consultar al Coach IA');
      const data = await res.json();

      // Check if Coach IA proposed and executed a routine modification
      if (data.routineUpdate && activeRoutine) {
        const update = data.routineUpdate;
        try {
          const currentRoutines = GymStorage.getRoutines();
          const targetRoutine = currentRoutines.find((r) => r.id === activeRoutine.id) || activeRoutine;
          const updatedDays = [...targetRoutine.days];

          if (update.action === 'replace_exercise' && update.newExercise) {
            let replaced = false;
            updatedDays.forEach((day, dIdx) => {
              if (update.targetDayIndex !== undefined && update.targetDayIndex !== dIdx) return;
              const exIdx = day.exercises.findIndex(
                (e) => e.name.toLowerCase().includes((update.exerciseName || '').toLowerCase())
              );
              if (exIdx >= 0) {
                day.exercises[exIdx] = {
                  id: `ex-mod-${Date.now()}`,
                  name: update.newExercise.name,
                  muscleGroup: update.newExercise.muscleGroup || day.exercises[exIdx].muscleGroup,
                  notes: update.newExercise.notes || day.exercises[exIdx].notes,
                  sets: Array.from({ length: update.newExercise.sets || 3 }, (_, sIdx) => ({
                    setNumber: sIdx + 1,
                    targetReps: update.newExercise.reps || '8-10',
                    targetWeightKg: 20,
                    restSeconds: 90,
                  })),
                };
                replaced = true;
              }
            });
            if (replaced) {
              const modifiedRoutine = { ...targetRoutine, days: updatedDays };
              GymStorage.addRoutine(modifiedRoutine);
              setAppliedUpdateNotice(update.confirmationMessage || `Se ha actualizado "${update.newExercise.name}" en tu rutina.`);
              setTimeout(() => setAppliedUpdateNotice(null), 6000);
            }
          }
        } catch (updateErr) {
          console.error('Error applying routine update:', updateErr);
        }
      }

      const coachMsg: CoachChatMessage = {
        id: generateUniqueId('msg-c'),
        sender: 'coach',
        text: data.reply || 'Entendido. Estoy aquí para resolver cualquier duda que tengas sobre tu entrenamiento.',
        timestamp: getCurrentTimeLabel(),
        suggestedFollowUps: data.suggestedFollowUps || [],
      };

      const finalMessages = [...updatedMessages, coachMsg];
      setMessages(finalMessages);
      GymStorage.saveCoachChat(finalMessages);
    } catch (err) {
      console.error(err);
      const errorMsg: CoachChatMessage = {
        id: generateUniqueId('msg-err'),
        sender: 'coach',
        text: 'Disculpa, ha ocurrido un leve retraso en la conexión. Por favor pulsa en reenviar o escribe de nuevo tu consulta para darte la respuesta exacta.',
        timestamp: getCurrentTimeLabel(),
        suggestedFollowUps: ['¿Cómo realizo correctamente este ejercicio?', 'Reintentar'],
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      GymStorage.saveCoachChat(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    GymStorage.clearCoachChat();
    const routineName = activeRoutine?.title || 'tu entrenamiento';
    const goal = activePlan?.profileSnapshot?.goal || activeRoutine?.userProfile?.goal || 'tus objetivos';
    const freshGreeting: CoachChatMessage = {
      id: generateUniqueId('msg-fresh'),
      sender: 'coach',
      text: `¡Conversación reiniciada! Soy tu **Coach IA personal**. Estoy listo para responder directamente cualquier pregunta que tengas sobre tu rutina **"${routineName}"**, ejercicios, técnica o nutrición. ¿Qué necesitas saber?`,
      timestamp: getCurrentTimeLabel(),
      suggestedFollowUps: [
        '¿Cómo caliento para mi rutina de hoy?',
        '¿Qué hago si una máquina está ocupada?',
        '¿Cómo sé cuándo subir de peso?',
      ],
    };
    setMessages([freshGreeting]);
    GymStorage.saveCoachChat([freshGreeting]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-2 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl h-[94vh] sm:h-[85vh] flex flex-col rounded-3xl liquid-glass-elevated border border-white/20 shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/20">
                <Dumbbell className="w-5 h-5 -rotate-45" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white ring-2 ring-black flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Coach IA • Entrenador Personal
                </h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white uppercase tracking-wider">
                  En línea
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {activeRoutine ? `Conectado a "${activeRoutine.title}"` : 'Asesoramiento biomecánico y deportivo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 1 && (
              <button
                onClick={handleClearChat}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition"
                title="Reiniciar chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Routine & Plan context badge bar */}
        {(activeRoutine || activePlan) && (
          <div className="liquid-glass-subtle border-b border-white/5 px-4 py-2 flex items-center gap-2 overflow-x-auto text-[10px] text-zinc-300 font-mono scrollbar-none shrink-0">
            <span className="text-zinc-500 uppercase tracking-wider shrink-0">Contexto activo:</span>
            {activeRoutine && (
              <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-white truncate max-w-[200px]">
                {activeRoutine.title} ({activeRoutine.days.length}d)
              </span>
            )}
            {activePlan && (
              <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-white truncate">
                Plan 6M • {activePlan.profileSnapshot.goal}
              </span>
            )}
            {activePlan?.profileSnapshot?.injuriesOrLimitations && (
              <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 truncate">
                Cuidado: {activePlan.profileSnapshot.injuriesOrLimitations}
              </span>
            )}
          </div>
        )}

        {/* Real-time Routine Update Notification */}
        {appliedUpdateNotice && (
          <div className="bg-emerald-950/70 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in slide-in-from-top-1">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{appliedUpdateNotice}</span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-white text-black font-medium shadow-lg'
                        : 'liquid-glass border border-white/15 text-zinc-200 shadow-xl'
                    }`}
                  >
                    {/* Render message with simple bold markdown styling */}
                    {msg.text.split('\n').map((line, lIdx) => {
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                          <div key={lIdx} className="flex items-start gap-1.5 my-1">
                            <span className="text-white font-bold shrink-0">•</span>
                            <span>{renderFormattedLine(line.substring(2))}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={lIdx} className={lIdx > 0 ? 'mt-2' : ''}>
                          {renderFormattedLine(line)}
                        </p>
                      );
                    })}
                  </div>

                  <div
                    className={`flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 px-1 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{isUser ? 'Tú' : 'Coach IA'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Contextual Suggested Follow-up chips */}
                  {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSendMessage(chip)}
                          className="text-[11px] liquid-glass-subtle hover:bg-white hover:text-black border border-white/10 hover:border-white px-2.5 py-1 rounded-xl text-zinc-300 font-medium transition text-left"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-zinc-800 border border-white/10 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3 justify-start items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 fill-black" />
              </div>
              <div className="liquid-glass border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Coach IA está analizando tu consulta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions when empty or idle */}
        {messages.length <= 2 && (
          <div className="px-3 sm:px-4 py-2 border-t border-white/5 bg-black/40 overflow-x-auto scrollbar-none shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3 text-zinc-400" />
                Sugerencias:
              </span>
              {DEFAULT_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-xl liquid-glass-subtle text-[11px] text-zinc-300 hover:text-white hover:border-white/20 transition border border-white/10"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/70 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pregúntale a tu entrenador personal..."
              disabled={isLoading}
              className="flex-1 liquid-glass-subtle border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-medium"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition shadow-lg ${
                inputText.trim() && !isLoading
                  ? 'bg-white text-black shadow-white/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <Send className="w-4 h-4 fill-current" />
            </motion.button>
          </form>
          <div className="text-[10px] text-zinc-500 text-center mt-1.5 font-mono">
            Respuestas basadas en ciencia deportiva y adaptadas a tu rutina activa.
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper function to format basic bold markdown like **text**
function renderFormattedLine(line: string) {
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={idx} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}
