"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";

interface Slide {
  title: string;
  content: string;
  bulletPoints: string[];
}

interface AIVideoPlayerProps {
  moduleTitle: string;
  moduleContent: string;
  topic: string;
}

function parseContentToSlides(content: string, moduleTitle: string): Slide[] {
  const slides: Slide[] = [];

  // Split content by headers
  const sections = content.split(/^#{1,3}\s+/m).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const title = lines[0]?.replace(/\*\*/g, "").trim() || moduleTitle;
    const bodyLines = lines.slice(1).filter((l) => l.trim());

    const bulletPoints: string[] = [];
    let bodyText = "";

    for (const line of bodyLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        bulletPoints.push(trimmed.slice(2).replace(/\*\*/g, ""));
      } else if (trimmed.match(/^\d+\.\s/)) {
        bulletPoints.push(trimmed.replace(/^\d+\.\s/, "").replace(/\*\*/g, ""));
      } else if (trimmed && !trimmed.startsWith("```")) {
        bodyText += trimmed.replace(/\*\*/g, "") + " ";
      }
    }

    if (title && (bodyText.trim() || bulletPoints.length > 0)) {
      slides.push({
        title: title.slice(0, 80),
        content: bodyText.trim().slice(0, 300),
        bulletPoints: bulletPoints.slice(0, 5),
      });
    }
  }

  // Ensure we have at least one slide
  if (slides.length === 0) {
    slides.push({
      title: moduleTitle,
      content: content.slice(0, 300).replace(/\*\*/g, "").replace(/#{1,3}\s/g, ""),
      bulletPoints: [],
    });
  }

  return slides.slice(0, 8); // Max 8 slides
}

export function AIVideoPlayer({
  moduleTitle,
  moduleContent,
  topic,
}: AIVideoPlayerProps) {
  const [slides] = useState<Slide[]>(() =>
    parseContentToSlides(moduleContent, moduleTitle)
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef(0);

  // Get narration text for current slide
  const getNarrationText = useCallback(
    (slide: Slide): string => {
      let text = slide.title + ". ";
      if (slide.content) text += slide.content + " ";
      for (const point of slide.bulletPoints) {
        text += point + ". ";
      }
      return text;
    },
    []
  );

  // Speak current slide
  const speakSlide = useCallback(
    (index: number) => {
      if (index >= slides.length) {
        setIsPlaying(false);
        return;
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(
        getNarrationText(slides[index])
      );
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = isMuted ? 0 : 1;

      // Try to use a good voice
      const voices = synth.getVoices();
      const englishVoice = voices.find(
        (v) => v.lang.startsWith("en") && v.name.includes("Google")
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (englishVoice) utterance.voice = englishVoice;

      utterance.onend = () => {
        if (index < slides.length - 1) {
          setCurrentSlide(index + 1);
          speakSlide(index + 1);
        } else {
          setIsPlaying(false);
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      synthRef.current = utterance;
      synth.speak(utterance);
    },
    [slides, isMuted, getNarrationText]
  );

  // Initialize
  useEffect(() => {
    setIsReady(true);
    // Load voices
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Progress animation
  useEffect(() => {
    if (isPlaying) {
      progressRef.current = 0;
      const slideDuration = 12000; // ~12 seconds per slide
      const step = 100 / (slideDuration / 50);

      intervalRef.current = setInterval(() => {
        progressRef.current = Math.min(progressRef.current + step, 100);
        setProgress(progressRef.current);
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentSlide]);

  // Reset progress on slide change
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [currentSlide]);

  function handlePlay() {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        speakSlide(currentSlide);
      }
      setIsPlaying(true);
    }
  }

  function handleNext() {
    window.speechSynthesis.cancel();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      if (isPlaying) {
        setTimeout(() => speakSlide(currentSlide + 1), 200);
      }
    }
  }

  function handlePrev() {
    window.speechSynthesis.cancel();
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      if (isPlaying) {
        setTimeout(() => speakSlide(currentSlide - 1), 200);
      }
    }
  }

  function handleToggleMute() {
    setIsMuted(!isMuted);
    if (synthRef.current) {
      synthRef.current.volume = isMuted ? 1 : 0;
    }
  }

  function handleSlideClick(index: number) {
    window.speechSynthesis.cancel();
    setCurrentSlide(index);
    if (isPlaying) {
      setTimeout(() => speakSlide(index), 200);
    }
  }

  const slide = slides[currentSlide];

  if (!isReady) {
    return (
      <Card className="aspect-video flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Video Area */}
      <Card className="overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-primary/5 via-background to-primary/10 relative flex flex-col items-center justify-center p-8">
          {/* Topic Badge */}
          <Badge variant="secondary" className="absolute top-4 left-4 text-xs">
            {topic}
          </Badge>

          {/* Slide Number */}
          <Badge variant="outline" className="absolute top-4 right-4 text-xs">
            {currentSlide + 1} / {slides.length}
          </Badge>

          {/* Main Content */}
          <div className="text-center space-y-4 max-w-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {slide.title}
            </h2>

            {slide.content && (
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {slide.content}
              </p>
            )}

            {slide.bulletPoints.length > 0 && (
              <ul className="text-left space-y-2 mt-4">
                {slide.bulletPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{
                      animation: `fadeIn 0.5s ${i * 0.2}s both`,
                    }}
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AI Narrator Indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">
              AI Narrator
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={currentSlide === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={handlePlay}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentSlide === slides.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slide Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSlideClick(i)}
            className={`shrink-0 p-2 rounded-lg border text-left transition-colors min-w-[120px] max-w-[160px] ${
              i === currentSlide
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <p className="text-xs font-medium truncate">{s.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Slide {i + 1}
            </p>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
