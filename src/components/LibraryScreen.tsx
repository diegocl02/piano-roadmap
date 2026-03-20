'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Area, Topic, CurriculumItem, ItemResource } from '@/types';
import { useLibrary } from '@/hooks/useLibrary';
import {
  ChevronDown, ChevronRight, ChevronUp, Plus, Pencil, Check, X, Trash2, Link, FileText,
} from 'lucide-react';

type Lib = ReturnType<typeof useLibrary>;

// ── Item Detail ──────────────────────────────────────────────────────────────

function ItemDetail({ item, lib }: { item: CurriculumItem; lib: Lib }) {
  const [notes, setNotes] = useState(item.notes ?? '');
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => { setNotes(item.notes ?? ''); }, [item.id, item.notes]);

  const saveNotes = () => {
    const val = notes.trim() || undefined;
    if (val !== item.notes) lib.updateItem({ ...item, notes: val });
  };

  const addResource = () => {
    if (!newUrl.trim()) return;
    const r: ItemResource = {
      id: crypto.randomUUID(),
      url: newUrl.trim(),
      label: newLabel.trim() || newUrl.trim(),
    };
    lib.updateItem({ ...item, resources: [...item.resources, r] });
    setNewUrl(''); setNewLabel('');
  };

  const removeResource = (id: string) =>
    lib.updateItem({ ...item, resources: item.resources.filter((r) => r.id !== id) });

  return (
    <div className="ml-8 mt-1 mb-2 p-3 bg-[var(--t-surf2)] rounded-lg border border-[var(--t-bord2)] space-y-3">
      {/* Notes */}
      <div>
        <div className="flex items-center gap-1 mb-1 text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest">
          <FileText className="w-3 h-3" /> Notas
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={2}
          placeholder="Notas de práctica..."
          className="w-full bg-[var(--t-surf)] border border-[var(--t-bord)] rounded-md px-2 py-1.5 text-xs text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500 font-mono resize-none"
        />
      </div>

      {/* Resources */}
      <div>
        <div className="flex items-center gap-1 mb-1 text-[10px] font-mono text-[var(--t-mute2)] uppercase tracking-widest">
          <Link className="w-3 h-3" /> Resources
        </div>
        {item.resources.length > 0 && (
          <div className="space-y-1 mb-2">
            {item.resources.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs group/res">
                <Link className="w-3 h-3 text-[var(--t-mute2)] shrink-0" />
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex-1 truncate"
                >
                  {r.label}
                </a>
                <button
                  onClick={() => removeResource(r.id)}
                  className="opacity-0 group-hover/res:opacity-100 text-[var(--t-mute2)] hover:text-red-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Etiqueta"
            className="w-20 bg-[var(--t-surf)] border border-[var(--t-bord)] rounded px-2 py-1 text-xs font-mono text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addResource(); }}
            placeholder="URL"
            className="flex-1 bg-[var(--t-surf)] border border-[var(--t-bord)] rounded px-2 py-1 text-xs font-mono text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={addResource}
            disabled={!newUrl.trim()}
            className="text-cyan-400 hover:text-cyan-300 disabled:opacity-30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item, lib, isFirst, isLast,
}: { item: CurriculumItem; lib: Lib; isFirst: boolean; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const submitRename = () => {
    if (editName.trim()) lib.updateItem({ ...item, name: editName.trim() });
    setEditing(false);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div>
      <div className="group flex items-center gap-1.5 py-1 px-2 rounded hover:bg-[var(--t-surf2)] transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--t-mute2)] hover:text-[var(--t-text)] shrink-0"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {editing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKey}
              onBlur={submitRename}
              className="flex-1 bg-[var(--t-surf)] border border-[var(--t-bord)] rounded px-2 py-0.5 text-xs font-mono text-[var(--t-text)] focus:outline-none focus:border-cyan-500"
            />
            <button onMouseDown={(e) => { e.preventDefault(); submitRename(); }} className="text-emerald-500 hover:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); setEditing(false); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span
            className="flex-1 text-xs text-[var(--t-text)] cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            {item.name}
            {(item.notes || item.resources.length > 0) && (
              <span className="ml-1.5 text-[var(--t-mute3)] font-mono">
                {item.resources.length > 0 && `${item.resources.length}🔗`}
                {item.notes && ' ✎'}
              </span>
            )}
          </span>
        )}

        {!editing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            {confirmDel ? (
              <>
                <span className="text-[10px] font-mono text-red-400 mr-1">¿Eliminar?</span>
                <button onClick={() => lib.deleteItem(item.id)} className="text-[10px] font-mono text-red-400 hover:text-red-300 font-semibold">Sí</button>
                <button onClick={() => setConfirmDel(false)} className="text-[10px] font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] ml-1">No</button>
              </>
            ) : (
              <>
                <button onClick={() => lib.moveItem(item.id, 'up')} disabled={isFirst} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] disabled:opacity-20 p-0.5">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={() => lib.moveItem(item.id, 'down')} disabled={isLast} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] disabled:opacity-20 p-0.5">
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button onClick={() => { setEditName(item.name); setEditing(true); }} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] p-0.5">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => setConfirmDel(true)} className="text-[var(--t-mute2)] hover:text-red-400 p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {expanded && <ItemDetail item={item} lib={lib} />}
    </div>
  );
}

// ── Topic Section ─────────────────────────────────────────────────────────────

function TopicSection({
  topic, lib, isFirst, isLast,
}: { topic: Topic; lib: Lib; isFirst: boolean; isLast: boolean }) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
  useEffect(() => { if (creating && createRef.current) createRef.current.focus(); }, [creating]);

  const submitRename = () => {
    if (editName.trim()) lib.renameTopic(topic.id, editName.trim());
    setEditing(false);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') setEditing(false);
  };

  const submitCreate = () => {
    if (newItemName.trim()) lib.createItem(topic.id, newItemName.trim());
    setCreating(false); setNewItemName('');
  };

  const handleCreateKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitCreate();
    if (e.key === 'Escape') { setCreating(false); setNewItemName(''); }
  };

  const sortedItems = [...topic.items].sort((a, b) => a.order - b.order);

  return (
    <div className="ml-4 mb-0.5">
      <div className="group flex items-center gap-1.5 py-1 px-2 rounded hover:bg-[var(--t-surf2)] transition-colors">
        <button onClick={() => setOpen(!open)} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] shrink-0">
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {editing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKey}
              onBlur={submitRename}
              className="flex-1 bg-[var(--t-surf)] border border-[var(--t-bord)] rounded px-2 py-0.5 text-xs font-mono text-[var(--t-text)] focus:outline-none focus:border-cyan-500"
            />
            <button onMouseDown={(e) => { e.preventDefault(); submitRename(); }} className="text-emerald-500 hover:text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); setEditing(false); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <span className="flex-1 text-xs font-medium text-[var(--t-mute)] cursor-pointer" onClick={() => setOpen(!open)}>
            {topic.name}
            <span className="ml-1.5 text-[var(--t-mute3)] font-mono">{topic.items.length}</span>
          </span>
        )}

        {!editing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            {confirmDel ? (
              <>
                <span className="text-[10px] font-mono text-red-400 mr-1">¿Eliminar?</span>
                <button onClick={() => lib.deleteTopic(topic.id)} className="text-[10px] font-mono text-red-400 hover:text-red-300 font-semibold">Sí</button>
                <button onClick={() => setConfirmDel(false)} className="text-[10px] font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] ml-1">No</button>
              </>
            ) : (
              <>
                <button onClick={() => lib.moveTopic(topic.id, 'up')} disabled={isFirst} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] disabled:opacity-20 p-0.5"><ChevronUp className="w-3 h-3" /></button>
                <button onClick={() => lib.moveTopic(topic.id, 'down')} disabled={isLast} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] disabled:opacity-20 p-0.5"><ChevronDown className="w-3 h-3" /></button>
                <button onClick={() => { setEditName(topic.name); setEditing(true); }} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] p-0.5"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => setConfirmDel(true)} className="text-[var(--t-mute2)] hover:text-red-400 p-0.5"><Trash2 className="w-3 h-3" /></button>
              </>
            )}
          </div>
        )}

        {!editing && !confirmDel && (
          <button
            onClick={() => { setCreating(true); setOpen(true); }}
            className="opacity-0 group-hover:opacity-100 text-[var(--t-mute2)] hover:text-cyan-400 transition-all p-0.5 ml-1"
            title="Agregar ítem"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (
        <div>
          {sortedItems.map((item, i) => (
            <ItemRow key={item.id} item={item} lib={lib} isFirst={i === 0} isLast={i === sortedItems.length - 1} />
          ))}
          {creating && (
            <div className="ml-4 flex items-center gap-1.5 py-1 px-2">
              <input
                ref={createRef}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleCreateKey}
                placeholder="Nombre del ítem..."
                className="flex-1 bg-[var(--t-surf)] border border-[var(--t-bord)] rounded px-2 py-0.5 text-xs font-mono text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500"
              />
              <button onClick={submitCreate} disabled={!newItemName.trim()} className="text-emerald-500 hover:text-emerald-400 disabled:opacity-30"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setCreating(false); setNewItemName(''); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="ml-8 text-[10px] font-mono text-[var(--t-mute3)] hover:text-cyan-400 py-0.5 px-2 transition-colors flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5" /> Ítem
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Area Section ──────────────────────────────────────────────────────────────

function AreaSection({
  area, lib, isFirst, isLast,
}: { area: Area; lib: Lib; isFirst: boolean; isLast: boolean }) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
  useEffect(() => { if (creating && createRef.current) createRef.current.focus(); }, [creating]);

  const submitRename = () => {
    if (editName.trim()) lib.renameArea(area.id, editName.trim());
    setEditing(false);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') setEditing(false);
  };

  const submitCreate = () => {
    if (newTopicName.trim()) lib.createTopic(area.id, newTopicName.trim());
    setCreating(false); setNewTopicName('');
  };

  const handleCreateKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitCreate();
    if (e.key === 'Escape') { setCreating(false); setNewTopicName(''); }
  };

  const sortedTopics = [...area.topics].sort((a, b) => a.order - b.order);

  return (
    <div className="mb-2">
      <div className="group flex items-center gap-2 py-1.5 px-2 rounded bg-[var(--t-surf)] border border-[var(--t-bord2)] transition-colors hover:border-[var(--t-bord)]">
        <button onClick={() => setOpen(!open)} className="text-[var(--t-mute2)] hover:text-cyan-400 shrink-0 transition-colors">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {editing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKey}
              onBlur={submitRename}
              className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded px-2 py-0.5 text-sm font-semibold font-mono text-[var(--t-text)] focus:outline-none focus:border-cyan-500"
            />
            <button onMouseDown={(e) => { e.preventDefault(); submitRename(); }} className="text-emerald-500 hover:text-emerald-400"><Check className="w-4 h-4" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); setEditing(false); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <span
            className="flex-1 text-sm font-semibold font-mono text-[var(--t-head)] uppercase tracking-wide cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            {area.name}
            <span className="ml-2 text-[var(--t-mute3)] font-normal normal-case tracking-normal text-xs">
              {area.topics.length} {area.topics.length === 1 ? 'tema' : 'temas'}
            </span>
          </span>
        )}

        {!editing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            {confirmDel ? (
              <>
                <span className="text-xs font-mono text-red-400 mr-1">¿Eliminar?</span>
                <button onClick={() => lib.deleteArea(area.id)} className="text-xs font-mono text-red-400 hover:text-red-300 font-semibold">Sí</button>
                <button onClick={() => setConfirmDel(false)} className="text-xs font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] ml-1">No</button>
              </>
            ) : (
              <>
                <button onClick={() => lib.moveArea(area.id, 'up')} disabled={isFirst} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] disabled:opacity-20 p-0.5"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => lib.moveArea(area.id, 'down')} disabled={isLast} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] disabled:opacity-20 p-0.5"><ChevronDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setEditName(area.name); setEditing(true); }} className="text-[var(--t-mute2)] hover:text-[var(--t-text)] p-0.5"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setConfirmDel(true)} className="text-[var(--t-mute2)] hover:text-red-400 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        )}

        {!editing && !confirmDel && (
          <button
            onClick={() => { setCreating(true); setOpen(true); }}
            className="opacity-0 group-hover:opacity-100 text-[var(--t-mute2)] hover:text-cyan-400 transition-all text-xs font-mono flex items-center gap-0.5 ml-1"
            title="Agregar tema"
          >
            <Plus className="w-3 h-3" /> Tema
          </button>
        )}
      </div>

      {open && (
        <div className="mt-1">
          {sortedTopics.map((topic, i) => (
            <TopicSection key={topic.id} topic={topic} lib={lib} isFirst={i === 0} isLast={i === sortedTopics.length - 1} />
          ))}
          {creating && (
            <div className="ml-4 flex items-center gap-1.5 py-1 px-2 mt-0.5">
              <input
                ref={createRef}
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={handleCreateKey}
                placeholder="Nombre del tema..."
                className="flex-1 bg-[var(--t-surf)] border border-[var(--t-bord)] rounded px-2 py-0.5 text-xs font-mono text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500"
              />
              <button onClick={submitCreate} disabled={!newTopicName.trim()} className="text-emerald-500 hover:text-emerald-400 disabled:opacity-30"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setCreating(false); setNewTopicName(''); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Library Screen ────────────────────────────────────────────────────────────

export function LibraryScreen({ lib }: { lib: Lib }) {
  const [creatingArea, setCreatingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const createAreaRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (creatingArea && createAreaRef.current) createAreaRef.current.focus(); }, [creatingArea]);

  const submitCreate = () => {
    if (newAreaName.trim()) lib.createArea(newAreaName.trim());
    setCreatingArea(false); setNewAreaName('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitCreate();
    if (e.key === 'Escape') { setCreatingArea(false); setNewAreaName(''); }
  };

  const sortedAreas = [...lib.state.areas].sort((a, b) => a.order - b.order);

  if (!lib.hydrated) {
    return (
      <div className="min-h-screen bg-[var(--t-bg)] flex items-center justify-center">
        <div className="font-mono text-cyan-400 text-sm animate-pulse tracking-widest">CARGANDO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--t-bg)] text-[var(--t-text)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 pt-2">
          <div className="text-xs font-mono text-[var(--t-mute2)] tracking-widest uppercase mb-2">
            Piano Roadmap Architect
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--t-head)]">Librería</h1>
              <p className="text-[var(--t-mute)] text-sm mt-1">
                Organiza tus Áreas, Temas e Ítems de estudio.
              </p>
            </div>
            <button
              onClick={() => setCreatingArea(true)}
              className="flex items-center gap-1.5 text-sm font-mono text-cyan-400 hover:text-cyan-300 bg-[var(--t-surf)] hover:bg-[var(--t-surf2)] border border-[var(--t-bord2)] hover:border-[var(--t-bord)] rounded-lg px-3 py-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Área
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {sortedAreas.map((area, i) => (
            <AreaSection key={area.id} area={area} lib={lib} isFirst={i === 0} isLast={i === sortedAreas.length - 1} />
          ))}

          {creatingArea && (
            <div className="flex items-center gap-2 p-3 bg-[var(--t-surf)] border border-[var(--t-bord2)] rounded-lg">
              <input
                ref={createAreaRef}
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Nombre del área..."
                className="flex-1 bg-[var(--t-surf2)] border border-[var(--t-bord)] rounded-md px-3 py-1.5 text-sm font-mono text-[var(--t-text)] placeholder:text-[var(--t-placeholder)] focus:outline-none focus:border-cyan-500"
              />
              <button onClick={submitCreate} disabled={!newAreaName.trim()} className="text-emerald-500 hover:text-emerald-400 disabled:opacity-30"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setCreatingArea(false); setNewAreaName(''); }} className="text-[var(--t-mute)] hover:text-[var(--t-text)]"><X className="w-4 h-4" /></button>
            </div>
          )}

          {sortedAreas.length === 0 && !creatingArea && (
            <button
              onClick={() => setCreatingArea(true)}
              className="w-full border border-dashed border-[var(--t-bord)] rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-sm font-mono text-[var(--t-mute2)] hover:text-[var(--t-text)] hover:bg-[var(--t-surf)] transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear primera Área
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
