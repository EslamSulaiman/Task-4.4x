import React, { useEffect, useMemo, useState } from 'react';

const STORE = 'acl-foundboard-v3';

// Fictional campus locations for this standalone teaching demo.
const seed = [
  { id: 'f1', title: 'Black backpack', category: 'accessories', status: 'lost', location: 'Library - second floor', description: 'Black backpack with a small red keychain. Left near the study desks.', owner: 'you', created: 'Oct 23', emoji: '🎒' },
  { id: 'f2', title: 'Dark backpack', category: 'accessories', status: 'found', location: 'Library - main stairwell', description: 'Found a dark backpack with a small red keychain near the library stairs.', owner: 'other', created: 'Oct 24', emoji: '🎒', collectionPoint: 'Campus Security Desk', handoverStatus: 'received' },
  { id: 'f3', title: 'Student ID card', category: 'documents', status: 'found', location: 'Near Gate 3', description: 'A student card was turned in. No personal details are published.', owner: 'other', created: 'Oct 24', emoji: '🪪', collectionPoint: 'Student Services Office', handoverStatus: 'received' },
  { id: 'f4', title: 'Wireless earbuds', category: 'electronics', status: 'lost', location: 'Main cafeteria', description: 'White earbuds in a distinctive blue case. Lost on Monday.', owner: 'other', created: 'Oct 24', emoji: '🎧' },
  { id: 'f5', title: 'Earbuds in blue case', category: 'electronics', status: 'found', location: 'Cafeteria entrance', description: 'White earbuds in a blue charging case found near the coffee counter.', owner: 'other', created: 'Oct 25', emoji: '🎧', collectionPoint: '', handoverStatus: 'reported' },
  { id: 'f6', title: 'Blue sports bottle', category: 'other', status: 'lost', location: 'Sports Hall - lockers', description: 'Tall blue metal water bottle, possibly left after practice.', owner: 'other', created: 'Oct 25', emoji: '🥤' },
  { id: 'f7', title: 'Metal water bottle', category: 'other', status: 'found', location: 'Sports Hall - benches', description: 'Blue reusable metal bottle found after a basketball session.', owner: 'other', created: 'Oct 25', emoji: '🥤', collectionPoint: 'Campus Security Desk', handoverStatus: 'received' },
  { id: 'f8', title: 'Engineering lab coat', category: 'clothing', status: 'claimed', location: 'Building C', description: 'Owner verified the item and collected it from the reception desk.', owner: 'you', created: 'Oct 22', emoji: '🥼', collectionPoint: 'Library Reception', handoverStatus: 'released' },
  { id: 'f9', title: 'Small notebook', category: 'other', status: 'lost', location: 'C7 lecture room', description: 'Brown cover with handwritten engineering notes.', owner: 'other', created: 'Oct 25', emoji: '📒' },
  { id: 'f10', title: 'Scientific calculator', category: 'electronics', status: 'lost', location: 'B2 lecture hall', description: 'Black scientific calculator with a protective cover.', owner: 'other', created: 'Oct 26', emoji: '🧮' },
  { id: 'f11', title: 'Calculator', category: 'electronics', status: 'found', location: 'B2 study area', description: 'Scientific calculator with a black cover, found on a desk.', owner: 'you', created: 'Oct 26', emoji: '🧮', collectionPoint: 'Library Reception', handoverStatus: 'received' },
  { id: 'f12', title: 'Canvas tote bag', category: 'accessories', status: 'lost', location: 'Main campus bus stop', description: 'Beige tote with green writing on one side.', owner: 'other', created: 'Oct 26', emoji: '👜' },
  { id: 'f13', title: 'USB flash drive', category: 'electronics', status: 'found', location: 'Building A computer lab', description: 'A small black flash drive was found beside a workstation.', owner: 'other', created: 'Oct 27', emoji: '💾', collectionPoint: '', handoverStatus: 'reported' },
];

const categories = ['all', 'electronics', 'clothing', 'documents', 'accessories', 'other'];
const statuses = ['lost', 'found', 'claimed'];
const clean = { title: '', category: '', status: '', location: '', description: '' };

function getSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    return Array.isArray(s) ? s : seed;
  } catch {
    return seed;
  }
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function validate(f, arr, id) {
  if (!f.title.trim() || f.title.trim().length < 2) return 'Title must be at least 2 characters.';
  if (!categories.slice(1).includes(f.category)) return 'Choose a category.';
  if (!statuses.includes(f.status)) return 'Choose lost, found or claimed.';
  if (arr.some(r => r.id !== id && r.title.toLowerCase() === f.title.trim().toLowerCase() && (r.location || '').toLowerCase() === (f.location || '').trim().toLowerCase())) {
    return 'An item with the same title has already been reported at this location.';
  }
  return '';
}

export default function App() {
  const [items, setItems] = useState(getSaved);
  const [page, setPage] = useState('board');
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(clean);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  // --- FIX 1: Decouple Draft Sidebar Inputs from Active Query Execution ---
  const [draftFilters, setDraftFilters] = useState({ q: '', cat: 'all', filterStatus: 'all' });
  const [appliedFilters, setAppliedFilters] = useState({ q: '', cat: 'all', filterStatus: 'all' });

  useEffect(() => localStorage.setItem(STORE, JSON.stringify(items)), [items]);

  // Execute filtering only against appliedFilters
  const filtered = useMemo(() => {
    const { q, cat, filterStatus } = appliedFilters;
    return items.filter(x => 
      (cat === 'all' || x.category === cat) &&
      (filterStatus === 'all' || x.status === filterStatus) &&
      `${x.title} ${x.location} ${x.description}`.toLowerCase().includes(q.toLowerCase())
    );
  }, [items, appliedFilters]);

  // --- FIX 3: Pre-Submit Real-Time Duplicate / Similar Matches ---
  const similarItems = useMemo(() => {
    if (!form.title.trim() || page !== 'form') return [];
    const searchTitle = form.title.trim().toLowerCase();
    const searchLoc = (form.location || '').trim().toLowerCase();

    return items.filter(item => {
      if (item.id === current) return false;
      const titleMatch = item.title.toLowerCase().includes(searchTitle) || searchTitle.includes(item.title.toLowerCase());
      const locMatch = !searchLoc || (item.location || '').toLowerCase().includes(searchLoc);
      return titleMatch && locMatch;
    });
  }, [form.title, form.location, items, current, page]);

  function create() {
    setCurrent(null);
    setForm({ ...clean });
    setError('');
    setPage('form');
  }

  function edit(row) {
    if (row.owner !== 'you') return;
    setCurrent(row.id);
    setForm({ title: row.title, category: row.category, status: row.status, location: row.location, description: row.description });
    setOpenMenu(null);
    setError('');
    setPage('form');
  }

  function submit(e) {
    e.preventDefault();
    const v = validate(form, items, current);
    if (v) {
      setError(v);
      return;
    }
    const d = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      owner: 'you',
      created: 'Today',
      emoji: current ? items.find(x => x.id === current)?.emoji : '📌',
      ...(current ? {} : { collectionPoint: '', handoverStatus: 'reported' })
    };

    if (current) {
      setItems(items.map(x => (x.id === current ? { ...x, ...d } : x)));
      setMessage('Report updated.');
    } else {
      setItems([{ id: `f-${Date.now()}`, ...d }, ...items]);
      setMessage('Your report has been posted.');
    }
    setPage('board');
    setCurrent(null);
  }

  function reset() {
    setItems(seed);
    setPage('board');
    const resetState = { q: '', cat: 'all', filterStatus: 'all' };
    setDraftFilters(resetState);
    setAppliedFilters(resetState);
    setMessage('Example reports restored.');
  }

  // --- FIX 2 & 1 Handler Functions ---
  const handleNavFilter = (statusVal) => {
    const newState = { q: '', cat: 'all', filterStatus: statusVal };
    setDraftFilters(newState);
    setAppliedFilters(newState);
    setPage('board');
  };

  const handleApply = () => {
    setAppliedFilters({ ...draftFilters });
    setMessage(`${filtered.length} reports shown.`);
  };

  const handleClear = () => {
    const emptyState = { q: '', cat: 'all', filterStatus: 'all' };
    setDraftFilters(emptyState);
    setAppliedFilters(emptyState);
  };

  return (
    <div className="notice-app">
      {/* HEADER: Fix 2 — Interactive navigation headers */}
      <header className="header">
        <div className="headline">
          <span className="sun">✺</span>
          <button onClick={() => setPage('board')} className="wordmark">FOUND<span>on campus</span></button>
          <p>Community noticeboard</p>
        </div>
        <div className="header-links">
          <button 
            style={{ fontWeight: appliedFilters.filterStatus === 'all' ? 'bold' : 'normal', textDecoration: appliedFilters.filterStatus === 'all' ? 'underline' : 'none' }} 
            onClick={() => handleNavFilter('all')}
          >
            Noticeboard
          </button>
          <button 
            style={{ fontWeight: appliedFilters.filterStatus === 'lost' ? 'bold' : 'normal', textDecoration: appliedFilters.filterStatus === 'lost' ? 'underline' : 'none' }} 
            onClick={() => handleNavFilter('lost')}
          >
            Missing items
          </button>
          <button 
            style={{ fontWeight: appliedFilters.filterStatus === 'found' ? 'bold' : 'normal', textDecoration: appliedFilters.filterStatus === 'found' ? 'underline' : 'none' }} 
            onClick={() => handleNavFilter('found')}
          >
            Recently found
          </button>
        </div>
        <button className="report-button" onClick={create}>+ Post a report</button>
      </header>

      <div className="ruleline">
        <span>SEARCH • DISCOVER • REUNITE</span>
        <span>Helping lost things find their way back.</span>
      </div>

      {page === 'board' ? (
        <main className="workspace">
          <aside className="filters">
            <p className="kicker">YOUR NOTICEBOARD</p>
            <h1>Lost something?<br /><em>You're in the right place.</em></h1>
            <p className="intro">Browse what the campus community has shared or post what you've lost or found.</p>
            
            {/* SIDEBAR: Fix 1 — Controlled Form Inputs bound to Draft State */}
            <div className="filterbox">
              <h3>Browse reports</h3>
              <label>Search items
                <input 
                  value={draftFilters.q} 
                  onChange={e => setDraftFilters({ ...draftFilters, q: e.target.value })} 
                  placeholder="What are you looking for?" 
                />
              </label>
              <label>Item category
                <select 
                  value={draftFilters.cat} 
                  onChange={e => setDraftFilters({ ...draftFilters, cat: e.target.value })}
                >
                  <option value="all">All categories</option>
                  {categories.slice(1).map(c => <option key={c} value={c}>{cap(c)}</option>)}
                </select>
              </label>
              <label>Report status
                <select 
                  value={draftFilters.filterStatus} 
                  onChange={e => setDraftFilters({ ...draftFilters, filterStatus: e.target.value })}
                >
                  <option value="all">All statuses</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <div className="filterbuttons">
                <button onClick={handleApply}>Apply</button>
                <button onClick={handleClear}>Clear</button>
              </div>
            </div>

            <div className="side-message">
              <span>📍</span>
              <strong>Lost or found something?</strong>
              <p>Every report gets us a little closer.</p>
              <button onClick={create}>Share your report →</button>
            </div>
            <button className="reset" onClick={reset}>Reset demo data</button>
          </aside>

          <section className="board">
            <div className="board-top">
              <div>
                <p className="kicker">CAMPUS COMMUNITY</p>
                <h2>Latest notices <span>({filtered.length})</span></h2>
              </div>
              <span className="time-note">Updated today</span>
            </div>
            {message && <div className="message" role="status">{message}<button onClick={() => setMessage('')}>✕</button></div>}

            <div className="board-grid">
              {[
                { key: 'lost', title: 'LOST', sub: 'Searching for these things', icon: '↗' },
                { key: 'found', title: 'FOUND', sub: 'Looking for the owners', icon: '⌁' },
                { key: 'claimed', title: 'CLAIMED', sub: 'Back where they belong', icon: '✓' }
              ].map(col => (
                <div className="board-column" key={col.key}>
                  <div className="column-head">
                    <span className={'col-icon ' + col.key}>{col.icon}</span>
                    <div>
                      <strong>{col.title}</strong>
                      <small>{col.sub}</small>
                    </div>
                    <span className="col-count">{filtered.filter(r => r.status === col.key).length}</span>
                  </div>
                  <div className="sticky-list">
                    {filtered.filter(r => r.status === col.key).map(item => (
                      <article className="sticky" key={item.id}>
                        <div className="sticky-top">
                          <span>{item.category}</span>
                          <div className="menu-holder">
                            <button className="menu" onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)} aria-label={`Actions for ${item.title}`}>···</button>
                            {openMenu === item.id && (
                              <div className="menu-popup">
                                {item.owner === 'you' ? <button onClick={() => edit(item)}>Edit your report</button> : <span>Reported by another student</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="sticky-emoji">{item.emoji}</div>
                        <h3>{item.title}</h3>
                        <p>{item.description || 'No additional description.'}</p>
                        {item.status !== 'lost' && (
                          <div className="handover-note">
                            {item.handoverStatus === 'received' && item.collectionPoint 
                              ? `Received at ${item.collectionPoint}` 
                              : item.handoverStatus === 'released' 
                              ? 'Collected by owner' 
                              : 'Reported found - not confirmed at a collection point'}
                          </div>
                        )}
                        <div className="sticky-bottom">
                          <span>⌖ {item.location || 'Location not provided'}</span>
                          <small>{item.created}</small>
                        </div>
                      </article>
                    ))}
                    {filtered.every(x => x.status !== col.key) && <div className="empty-column">Nothing here yet</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="report-page">
          <div className="crumbs">
            <button onClick={() => setPage('board')}>← Noticeboard</button>
            <span>/</span>
            <span>Report an item</span>
          </div>
          <div className="report-layout">
            <div className="report-intro">
              <span className="seal">MB</span>
              <p className="kicker">HELP THE COMMUNITY</p>
              <h1>{current ? 'Update your report' : 'Tell us what happened.'}</h1>
              <p>Small details can help someone recognize their belongings.</p>
              <div className="paper-note">Your report will appear on the public campus noticeboard with the details you provide.</div>
            </div>
            
            <section className="form-paper">
              <header>
                <p>NEW NOTICE / FORM 01</p>
                <h2>{current ? 'Edit report' : 'Report an item'}</h2>
              </header>
              <form onSubmit={submit}>
                <label>Item title <b>*</b>
                  <input value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} placeholder="e.g., Black backpack" />
                </label>

                {/* FIX 3: Pre-Submit Duplicate Suggestion Display */}
                {similarItems.length > 0 && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '10px 12px', borderRadius: '6px', margin: '8px 0', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#B45309', display: 'block', marginBottom: '4px' }}>⚠️ Matching notices already on board:</strong>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#92400E' }}>
                      {similarItems.map(sim => (
                        <li key={sim.id}>
                          <strong>{sim.title}</strong> ({sim.status}) — <em>{sim.location || 'No location'}</em>
                        </li>
                      ))}
                    </ul>
                    <small style={{ color: '#B45309', display: 'block', marginTop: '4px' }}>
                      Review existing reports to avoid duplicate posts.
                    </small>
                  </div>
                )}

                <label>Status <b>*</b>
                  <select value={form.status} onChange={e => setForm(s => ({ ...s, status: e.target.value }))}>
                    <option value="">Choose one</option>
                    {statuses.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                  </select>
                </label>
                <label>Category <b>*</b>
                  <select value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
                    <option value="">Select item category</option>
                    {categories.slice(1).map(s => <option key={s} value={s}>{cap(s)}</option>)}
                  </select>
                </label>
                <label>Last known location
                  <input value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} placeholder="Location (optional)" />
                </label>
                <label>More details
                  <textarea rows="6" value={form.description} onChange={e => setForm(s => ({ ...s, description: e.target.value }))} placeholder="Describe your item" />
                </label>
                
                {error && <div className="form-error" role="alert">{error}</div>}
                
                <div className="form-actions">
                  <button type="button" onClick={() => setPage('board')}>Go back</button>
                  <button className="report-button" type="submit">{current ? 'Save report' : 'Publish notice'}</button>
                </div>
              </form>
            </section>
          </div>
        </main>
      )}

      <footer className="pagefooter">
        <span>FOUND / Campus noticeboard</span>
        <span>Community project • Demo only</span>
      </footer>
    </div>
  );
}
