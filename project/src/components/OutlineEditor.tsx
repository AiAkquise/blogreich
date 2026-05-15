import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Pencil,
  Check,
} from 'lucide-react';

export interface OutlineSection {
  h2: string;
  h3: string[];
  key_points: string[];
}

interface OutlineEditorProps {
  sections: OutlineSection[];
  onChange: (sections: OutlineSection[]) => void;
}

const MAX_SECTIONS = 10;
const MIN_SECTIONS = 2;

export function OutlineEditor({ sections, onChange }: OutlineEditorProps) {
  const [editingH2, setEditingH2] = useState<number | null>(null);
  const [editingH3, setEditingH3] = useState<{ section: number; index: number } | null>(null);

  const updateSection = (index: number, updated: Partial<OutlineSection>) => {
    const next = sections.map((s, i) => (i === index ? { ...s, ...updated } : s));
    onChange(next);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const removeSection = (index: number) => {
    if (sections.length <= MIN_SECTIONS) return;
    onChange(sections.filter((_, i) => i !== index));
  };

  const addSection = () => {
    if (sections.length >= MAX_SECTIONS) return;
    onChange([...sections, { h2: 'Neuer Abschnitt', h3: [], key_points: [] }]);
  };

  const addH3 = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    updateSection(sectionIndex, { h3: [...section.h3, 'Neuer Unterabschnitt'] });
    setEditingH3({ section: sectionIndex, index: section.h3.length });
  };

  const updateH3 = (sectionIndex: number, h3Index: number, value: string) => {
    const section = sections[sectionIndex];
    const next = section.h3.map((h, i) => (i === h3Index ? value : h));
    updateSection(sectionIndex, { h3: next });
  };

  const removeH3 = (sectionIndex: number, h3Index: number) => {
    const section = sections[sectionIndex];
    updateSection(sectionIndex, { h3: section.h3.filter((_, i) => i !== h3Index) });
    if (editingH3?.section === sectionIndex && editingH3?.index === h3Index) {
      setEditingH3(null);
    }
  };

  const moveH3 = (sectionIndex: number, h3Index: number, direction: 'up' | 'down') => {
    const section = sections[sectionIndex];
    const target = direction === 'up' ? h3Index - 1 : h3Index + 1;
    if (target < 0 || target >= section.h3.length) return;
    const next = [...section.h3];
    [next[h3Index], next[target]] = [next[target], next[h3Index]];
    updateSection(sectionIndex, { h3: next });
  };

  return (
    <div className="space-y-3">
      {sections.map((section, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 pt-0.5">
              <button
                onClick={() => moveSection(i, 'up')}
                disabled={i === 0}
                className="p-0.5 rounded text-surface-400 hover:text-surface-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:text-surface-300"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveSection(i, 'down')}
                disabled={i === sections.length - 1}
                className="p-0.5 rounded text-surface-400 hover:text-surface-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:text-surface-300"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                  H2
                </span>
                {editingH2 === i ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={section.h2}
                      onChange={(e) => updateSection(i, { h2: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingH2(null)}
                      autoFocus
                      className="flex-1 rounded border border-primary-300 bg-white px-2 py-1 text-sm font-medium text-surface-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-700 dark:bg-surface-800 dark:text-surface-100"
                    />
                    <button
                      onClick={() => setEditingH2(null)}
                      className="p-1 text-emerald-600 hover:text-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingH2(i)}
                    className="flex items-center gap-1 text-sm font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 text-left"
                  >
                    {section.h2}
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </button>
                )}
              </div>

              {section.h3.length > 0 && (
                <div className="ml-4 space-y-1 mt-2">
                  {section.h3.map((h3, j) => (
                    <div key={j} className="flex items-center gap-1.5">
                      <div className="flex gap-0">
                        <button
                          onClick={() => moveH3(i, j, 'up')}
                          disabled={j === 0}
                          className="p-0.5 text-surface-300 hover:text-surface-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveH3(i, j, 'down')}
                          disabled={j === section.h3.length - 1}
                          className="p-0.5 text-surface-300 hover:text-surface-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs text-surface-400 dark:text-surface-500">H3</span>
                      {editingH3?.section === i && editingH3?.index === j ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={h3}
                            onChange={(e) => updateH3(i, j, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingH3(null)}
                            autoFocus
                            className="flex-1 rounded border border-surface-300 bg-white px-2 py-0.5 text-xs text-surface-700 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
                          />
                          <button
                            onClick={() => setEditingH3(null)}
                            className="p-0.5 text-emerald-600"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingH3({ section: i, index: j })}
                          className="text-xs text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
                        >
                          {h3}
                        </button>
                      )}
                      <button
                        onClick={() => removeH3(i, j)}
                        className="p-0.5 text-surface-300 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => addH3(i)}
                className="mt-2 ml-4 flex items-center gap-1 text-xs text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <Plus className="h-3 w-3" />
                Unterabschnitt
              </button>

              {section.key_points.length > 0 && (
                <div className="mt-2 ml-4">
                  <span className="text-xs text-surface-400 dark:text-surface-500">
                    Kernaussagen:{' '}
                  </span>
                  <span className="text-xs text-surface-500 dark:text-surface-400">
                    {section.key_points.join(' · ')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => removeSection(i)}
              disabled={sections.length <= MIN_SECTIONS}
              className="p-1 rounded text-surface-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      ))}

      {sections.length < MAX_SECTIONS && (
        <Button variant="outline" onClick={addSection} className="w-full">
          <Plus className="h-4 w-4" />
          Abschnitt hinzufuegen
        </Button>
      )}
    </div>
  );
}
