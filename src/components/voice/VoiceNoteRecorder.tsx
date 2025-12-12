import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, X, Send, RotateCcw, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  placeholder = "Appuyez longuement pour enregistrer",
  className,
  compact = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startXRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CANCEL_THRESHOLD = -80;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Check for supported MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }

      console.log('Using MIME type:', mimeType || 'browser default');

      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setDuration(0);
    setAudioBlob(null);
    setSwipeDistance(0);
    onCancel?.();
  }, [onCancel]);

  // Handle long press start
  const handlePressStart = useCallback((clientX: number) => {
    setIsPressing(true);
    startXRef.current = clientX;

    longPressTimerRef.current = setTimeout(() => {
      startRecording();
    }, 300);
  }, [startRecording]);

  // Handle press move (for swipe to cancel)
  const handlePressMove = useCallback((clientX: number) => {
    if (isRecording) {
      const distance = clientX - startXRef.current;
      setSwipeDistance(Math.min(0, distance));

      if (distance < CANCEL_THRESHOLD) {
        cancelRecording();
        toast.info('Enregistrement annulé');
      }
    }
  }, [isRecording, cancelRecording]);

  // Handle press end
  const handlePressEnd = useCallback(() => {
    setIsPressing(false);
    setSwipeDistance(0);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handlePressStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handlePressMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handlePressEnd();
  };

  // Mouse handlers (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    handlePressStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPressing) {
      handlePressMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    handlePressEnd();
  };

  // Playback controls
  const togglePlayback = useCallback(() => {
    if (!audioBlob) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audioRef.current?.currentTime || 0));
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioBlob, isPlaying]);

  // Reset recording
  const resetRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setDuration(0);
    setIsPlaying(false);
    setPlaybackTime(0);
  }, []);

  // Send recording
  const sendRecording = useCallback(() => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
      resetRecording();
    }
  }, [audioBlob, duration, onRecordingComplete, resetRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Preview mode (after recording)
  if (audioBlob) {
    return (
      <div className={cn(
        "bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-4",
        "border border-primary/20",
        className
      )}>
        <div className="flex items-center gap-3">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayback}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              "bg-primary text-primary-foreground shadow-lg",
              "hover:scale-105 active:scale-95"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Waveform visualization (simplified) */}
          <div className="flex-1 flex items-center gap-0.5 h-8 px-2">
            {Array.from({ length: 30 }).map((_, i) => {
              const height = 4 + Math.sin(i * 0.5) * 12 + Math.random() * 8;
              const isActive = (playbackTime / duration) * 30 > i;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all",
                    isActive ? "bg-primary" : "bg-primary/30"
                  )}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {/* Duration */}
          <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
            {formatTime(isPlaying ? playbackTime : duration)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetRecording}
            className="flex-1 rounded-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Recommencer
          </Button>
          <Button
            size="sm"
            onClick={sendRecording}
            className="flex-1 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4 mr-2" />
            Envoyer
          </Button>
        </div>
      </div>
    );
  }

  // Recording mode
  if (isRecording) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl p-4",
          "border border-red-500/30",
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handlePressEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-4">
          {/* Cancel hint */}
          <div 
            className="flex items-center gap-2 text-red-500 transition-opacity"
            style={{ opacity: Math.min(1, Math.abs(swipeDistance) / 50) }}
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-medium">Annuler</span>
          </div>

          <div className="flex-1" />

          {/* Recording indicator */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-red-500">
              {formatTime(duration)}
            </span>

            {/* Animated recording dot */}
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-red-500/50 animate-ping" />
            </div>
          </div>

          {/* Mic button with wave animation */}
          <div 
            className="relative"
            style={{ transform: `translateX(${swipeDistance}px)` }}
          >
            {/* Pulsating waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-16 h-16 rounded-full bg-red-500/20 animate-[ping_1.5s_ease-in-out_infinite]" />
              <div className="absolute w-20 h-20 rounded-full bg-red-500/10 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
            </div>
            
            <div className="relative w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Swipe hint */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          ← Glisser pour annuler • Relâcher pour arrêter
        </p>
      </div>
    );
  }

  // Default state (not recording)
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Placeholder text */}
      {!compact && (
        <p className="flex-1 text-sm text-muted-foreground">
          {placeholder}
        </p>
      )}

      {/* Mic button */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={cn(
          "relative flex items-center justify-center transition-all",
          "touch-none select-none",
          compact ? "w-10 h-10" : "w-14 h-14",
          "rounded-full",
          "bg-gradient-to-br from-primary to-primary/80",
          "text-primary-foreground shadow-lg",
          "hover:scale-105 active:scale-95",
          isPressing && "scale-110"
        )}
      >
        <Mic className={cn(compact ? "w-5 h-5" : "w-6 h-6")} />
        
        {/* Press indicator ring */}
        {isPressing && (
          <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping" />
        )}
      </button>
    </div>
  );
};

export default VoiceNoteRecorder;
