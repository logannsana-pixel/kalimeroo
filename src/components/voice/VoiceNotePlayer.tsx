import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration: number;
  onDelete?: () => void;
  className?: string;
  showDelete?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration,
  onDelete,
  className,
  showDelete = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setIsLoaded(true);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  // Toggle playback
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Calculate progress
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate waveform bars (static visualization)
  const waveformBars = Array.from({ length: 40 }).map((_, i) => {
    const height = 4 + Math.sin(i * 0.4) * 10 + Math.sin(i * 0.8) * 6;
    return height;
  });

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-2xl",
      "bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5",
      "border border-primary/10",
      className
    )}>
      {/* Play/Pause button */}
      <button
        onClick={togglePlayback}
        disabled={!isLoaded}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          "bg-primary text-primary-foreground",
          "transition-all hover:scale-105 active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-px h-8 overflow-hidden">
        {waveformBars.map((height, i) => {
          const isActive = progress > (i / waveformBars.length) * 100;
          return (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-colors duration-150",
                isActive ? "bg-primary" : "bg-primary/25"
              )}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 shrink-0">
        <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground min-w-[36px]">
          {formatTime(isPlaying ? currentTime : duration)}
        </span>
      </div>

      {/* Delete button */}
      {showDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="shrink-0 w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default VoiceNotePlayer;
