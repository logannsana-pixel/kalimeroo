import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, 
  Link, Image, Quote, Code, Minus
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback((before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restaurer le curseur après le texte inséré
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    
    onChange(newText);
  }, [value, onChange]);

  const toolbarButtons = [
    { icon: Bold, label: "Gras", action: () => insertText("**", "**") },
    { icon: Italic, label: "Italique", action: () => insertText("*", "*") },
    { icon: Heading1, label: "Titre 1", action: () => insertAtLineStart("# ") },
    { icon: Heading2, label: "Titre 2", action: () => insertAtLineStart("## ") },
    { icon: Heading3, label: "Titre 3", action: () => insertAtLineStart("### ") },
    { icon: List, label: "Liste à puces", action: () => insertAtLineStart("- ") },
    { icon: ListOrdered, label: "Liste numérotée", action: () => insertAtLineStart("1. ") },
    { icon: Quote, label: "Citation", action: () => insertAtLineStart("> ") },
    { icon: Code, label: "Code", action: () => insertText("`", "`") },
    { icon: Link, label: "Lien", action: () => insertText("[", "](url)") },
    { icon: Image, label: "Image", action: () => insertText("![alt](", ")") },
    { icon: Minus, label: "Séparateur", action: () => insertText("\n---\n") },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <TooltipProvider>
          {toolbarButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={button.action}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{button.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Editor */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Écrivez votre article en Markdown..."
        className="min-h-[400px] border-0 rounded-none resize-y font-mono text-sm focus-visible:ring-0"
      />

      {/* Preview hint */}
      <div className="px-3 py-2 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Markdown supporté. Utilisez ** pour le gras, * pour l'italique, # pour les titres.
        </p>
      </div>
    </div>
  );
}
