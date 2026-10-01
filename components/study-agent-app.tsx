const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Literature', 'Programming', 'Economics'];

type Settings = {
  provider: 'groq' | 'openrouter';
  model: string;
  groqApiKey: string;
  openRouterApiKey: string;
  pollinationApiKey: string;
};

type Note = {
  id: number;
  subject: string;
  title: string;
  content: string;
  createdAt: string;
};

const defaultSettings: Settings = {
  provider: 'groq',
  model: 'qwen/qwen-2.5-32b',
  groqApiKey: '',
  openRouterApiKey: '',
  pollinationApiKey: '',
};

export default function StudyAgentApp() {
  const [activeTab, setActiveTab] = useState<'agent' | 'settings'>('agent');
  const [subject, setSubject] = useState('Mathematics');
  const [prompt, setPrompt] = useState('Explain the concept of derivatives in a simple way and give 3 practice questions.');
  const [assistantAnswer, setAssistantAnswer] = useState('Your AI tutor will respond here.');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [imagePrompt, setImagePrompt] = useState('A beautiful scientific diagram of the solar system with soft lighting, clean vector style');
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('study-agent-settings');
    const savedNotes = localStorage.getItem('study-agent-notes');

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Settings;
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        console.warn('Could not parse saved settings');
      }
    }

    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes) as Note[]);
      } catch {
        console.warn('Could not parse saved notes');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('study-agent-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('study-agent-notes', JSON.stringify(notes));
  }, [notes]);

  const saveNote = () => {
    const finalTitle = noteTitle.trim() || `${subject} study note`;
    const finalContent = (noteContent || assistantAnswer || prompt).trim();

    if (!finalContent) {
      return;
    }

    const newNote: Note = {
      id: Date.now(),
      subject,
      title: finalTitle,
      content: finalContent,
      createdAt: new Date().toLocaleString(),
    };

    setNotes(prev => [newNote, ...prev]);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleAskAi = async () => {
    const apiKey = settings.provider === 'groq' ? settings.groqApiKey : settings.openRouterApiKey;

    if (!apiKey) {
      alert(`Please add your ${settings.provider === 'groq' ? 'Groq' : 'OpenRouter'} API key in Settings.`);
      setActiveTab('settings');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.provider,
          key: apiKey,
          model: settings.model,
          subject,
          prompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI request failed');
      }

      setAssistantAnswer(data.answer || 'No answer returned.');
      setNoteContent(data.answer || '');
    } catch (error: unknown) {
      setAssistantAnswer(
        error instanceof Error ? error.message : 'Something went wrong while calling the AI model.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      return;
    }

    setImageLoading(true);

    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          key: settings.pollinationApiKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Image generation failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Image generation failed');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="container">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">S</div>
            Study Agent
          </div>

          <div className="nav-buttons">
            <button className="nav-button" onClick={() => setActiveTab('agent')}>
              Study Agent
            </button>
            <button className="primary-button" onClick={() => setActiveTab('settings')}>
              Settings
            </button>
          </div>
        </header>

        {activeTab === 'agent' ? (
          <>
            <section className="panel-grid">
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Study Companion</h2>
                  <button className="secondary-button" onClick={handleAskAi} disabled={loading}>
                    {loading ? 'Thinking...' : 'Ask AI'}
                  </button>
                </div>

                <div className="subject-row">
                  {SUBJECTS.map(item => (
                    <button
                      key={item}
                      type="button"
                      className={`subject-chip ${subject === item ? 'active' : ''}`}
                      onClick={() => setSubject(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <label className="label">Prompt</label>
                <textarea
                  className="prompt-box"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ask for explanation, revision notes, examples, or practice questions..."
                />

                <div className="action-row">
                  <button className="ghost-button" onClick={() => setPrompt('')}>
                    Clear
                  </button>
                  <button className="primary-button" onClick={handleAskAi} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Study Notes'}
                  </button>
                </div>

                <div className="answer-box">
                  {assistantAnswer}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Notes</h2>
                  <button className="secondary-button" onClick={saveNote}>
                    Save note
                  </button>
                </div>

                <div className="field">
                  <label className="label">Title</label>
                  <input
                    className="input"
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                    placeholder="e.g. Derivatives summary"
                  />
                </div>

                <div style={{ marginTop: 16 }} className="field">
                  <label className="label">Note content</label>
                  <textarea
                    className="note-textarea"
                    rows={8}
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    placeholder="Save your study summary or notes here..."
                  />
                </div>

                <div className="notes-list">
                  {notes.length === 0 ? (
                    <p className="empty-state">No notes saved yet. Save a note from the AI output or write your own.</p>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="note-card">
                        <h4>{note.title}</h4>
                        <p>{note.content}</p>
                        <div className="note-meta">
                          {note.subject} • {note.createdAt}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="panel image-panel">
              <div className="panel-header">
                <h2 className="panel-title">Image Generator</h2>
              </div>

              <div className="image-controls">
                <input
                  className="input"
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  placeholder="Describe the concept you want illustrated..."
                />
                <button className="primary-button" onClick={handleGenerateImage} disabled={imageLoading}>
                  {imageLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {imageUrl ? (
                <img className="generated-image" src={imageUrl} alt="Generated concept art" />
              ) : (
                <p className="empty-state">No image generated yet. Use Pollination to create a visual summary for your topic.</p>
              )}
            </section>
          </>
        ) : (
          <section className="panel" style={{ marginTop: 24 }}>
            <div className="panel-header">
              <h2 className="panel-title">API Settings</h2>
            </div>

            <div className="settings-grid">
              <div className="field">
                <label className="label">AI provider</label>
                <select
                  className="select"
                  value={settings.provider}
                  onChange={e => setSettings(prev => ({ ...prev, provider: e.target.value as 'groq' | 'openrouter' }))}
                >
                  <option value="groq">Groq</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              <div className="field">
                <label className="label">Model</label>
                <input
                  className="input"
                  value={settings.model}
                  onChange={e => setSettings(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Example: qwen/qwen-2.5-32b or openai/gpt-4o-mini"
                />
              </div>

              {settings.provider === 'groq' ? (
                <div className="field">
                  <label className="label">Groq API key</label>
                  <input
                    className="input"
                    type="password"
                    value={settings.groqApiKey}
                    onChange={e => setSettings(prev => ({ ...prev, groqApiKey: e.target.value }))}
                    placeholder="Enter your Groq API key"
                  />
                </div>
              ) : (
                <div className="field">
                  <label className="label">OpenRouter API key</label>
                  <input
                    className="input"
                    type="password"
                    value={settings.openRouterApiKey}
                    onChange={e => setSettings(prev => ({ ...prev, openRouterApiKey: e.target.value }))}
                    placeholder="Enter your OpenRouter API key"
                  />
                </div>
              )}

              <div className="field">
                <label className="label">Pollination API key</label>
                <input
                  className="input"
                  type="password"
                  value={settings.pollinationApiKey}
                  onChange={e => setSettings(prev => ({ ...prev, pollinationApiKey: e.target.value }))}
                  placeholder="Optional: Add your Pollination key"
                />
              </div>

              <div className="settings-actions">
                <button className="primary-button" onClick={() => setActiveTab('agent')}>
                  Save and return to Study Agent
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
