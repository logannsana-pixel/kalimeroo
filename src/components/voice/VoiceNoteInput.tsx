import React, { useState, useCallback } from 'react';
import { Mic, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { cn } from '@/lib/utils';

interface VoiceNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  audioBlob?: Blob | null;
  audioDuration?: number;
  onAudioChange?: (blob: Blob | null, duration: number) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

type InputMode = 'text' | 'voice';

export const VoiceNoteInput: React.FC<VoiceNoteInputProps> = ({
  value,
  onChange,
  audioBlob,
  audioDuration = 0,
  onAudioChange,
  placeholder = "Tapez ou enregistrez un message vocal...",
  label,
  className
}) => {
  const [mode, setMode] = useState<InputMode>('text');
  const [localAudioBlob, setLocalAudioBlob] = useState<Blob | null>(audioBlob || null);
  const [localAudioDuration, setLocalAudioDuration] = useState(audioDuration);

  // Handle recording complete
  const handleRecordingComplete = useCallback((blob: Blob, duration: number) => {
    setLocalAudioBlob(blob);
    setLocalAudioDuration(duration);
    onAudioChange?.(blob, duration);
    setMode('text'); // Return to text mode after recording
  }, [onAudioChange]);

  // Delete audio
  const handleDeleteAudio = useCallback(() => {
    setLocalAudioBlob(null);
    setLocalAudioDuration(0);
    onAudioChange?.(null, 0);
  }, [onAudioChange]);

  // Get audio URL for player
  const audioUrl = localAudioBlob ? URL.createObjectURL(localAudioBlob) : null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-2">
        <Button
          type="button"
          variant={mode === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('text')}
          className="rounded-full text-xs"
        >
          <Keyboard className="w-3.5 h-3.5 mr-1.5" />
          Texte
        </Button>
        <Button
          type="button"
          variant={mode === 'voice' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('voice')}
          className="rounded-full text-xs"
        >
          <Mic className="w-3.5 h-3.5 mr-1.5" />
          Vocal
        </Button>
      </div>

      {/* Audio player (if recording exists) */}
      {audioUrl && (
        <VoiceNotePlayer
          audioUrl={audioUrl}
          duration={localAudioDuration}
          onDelete={handleDeleteAudio}
          className="mb-2"
        />
      )}

      {/* Input area */}
      {mode === 'text' ? (
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "min-h-[80px] rounded-2xl resize-none pr-12",
              "bg-muted/50 border-muted focus:border-primary/50"
            )}
          />
          {/* Quick voice button */}
          <button
            type="button"
            onClick={() => setMode('voice')}
            className={cn(
              "absolute bottom-3 right-3",
              "w-8 h-8 rounded-full",
              "bg-primary/10 text-primary",
              "flex items-center justify-center",
              "hover:bg-primary/20 transition-colors"
            )}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <VoiceNoteRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setMode('text')}
          placeholder="Appuyez longuement sur le micro pour enregistrer"
        />
      )}
    </div>
  );
};

export default VoiceNoteInput;
