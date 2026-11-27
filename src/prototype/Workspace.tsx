import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, ChevronDown, CircleHelp, Clock3, LayoutGrid, Menu, Moon, PanelLeftClose, Plus, Search, Sun, Users, X } from 'lucide-react';
import { animate, AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
import './workspace.css';

const nav = [
  { name: 'Overview', icon: LayoutGrid },
  { name: 'Analytics', icon: BarChart3 },
  { name: 'Customers', icon: Users },
  { name: 'Activity', icon: Activity },
] as const;
type View = typeof nav[number]['name'];
type Range = '7' | '30' | '90';
type RecordItem = { id: number; name: string; product: string; status: 'Active' | 'Pilot' | 'Pending'; date: string };

const periods: Record<Range, { chart: number[]; users: number; sessions: number; rate: number; time: number }> = {
  '7': { chart: [14, 20, 17, 23, 24, 26, 22, 31, 28, 33, 34, 37], users: 641, sessions: 1192, rate: 4.2, time: 4 },
  '30': { chart: [21, 31, 26, 40, 42, 36, 55, 47, 63, 51, 69, 73], users: 2846, sessions: 6324, rate: 5.8, time: 6 },
  '90': { chart: [32, 34, 41, 48, 41, 56, 53, 67, 64, 74, 83, 90], users: 8053, sessions: 17842, rate: 6.1, time: 7 },
};
const initialRecords: RecordItem[] = [
  { id: 1, name: 'Lakeview Suites', product: 'HotelOS', status: 'Active', date: 'Nov 26' },
  { id: 2, name: 'Cedar Market', product: 'DayTech POS', status: 'Pilot', date: 'Nov 24' },
  { id: 3, name: 'Kijani Academy', product: 'DayTech Schools', status: 'Active', date: 'Nov 22' },
  { id: 4, name: 'Acacia Retail', product: 'Customer Portal', status: 'Pending', date: 'Nov 20' },
];

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    if (reduced) { setDisplay(value); previous.current = value; return; }
    const playback = animate(previous.current, value, {
      duration: 0.32,
      onUpdate: current => { previous.current = current; setDisplay(current); },
    });
    return () => playback.stop();
  }, [reduced, value]);
  const format = (n: number) => n.toLocaleString('en-UG', { maximumFractionDigits: Number.isInteger(value) ? 0 : 1 }) + suffix;
  return <span aria-label={format(value)}><span aria-hidden="true">{format(display)}</span></span>;
}

function EngagementChart({ range }: { range: Range }) {
  const [focused, setFocused] = useState<number | null>(null);
  const values = periods[range].chart;
  const current = focused ?? values.length - 1;
  return (
    <section className="dt-panel dt-chart" aria-labelledby="engagement-title">
      <div className="dt-card-heading">
        <div><h2 id="engagement-title">Engagement</h2><p>Session volume across your products</p></div>
        <span className="dt-legend"><i /> Sessions</span>
      </div>
      <div className="dt-plot">
        <div className="dt-axis" aria-hidden="true"><span>2k</span><span>1.5k</span><span>1k</span><span>500</span><span>0</span></div>
        <div className="dt-bars" aria-label="Select a period to inspect its session volume">
          {values.map((value, index) => (
            <button key={index} type="button" aria-label={`Period ${index + 1}, ${value * 20} sessions`}
              aria-pressed={current === index} onClick={() => setFocused(index)}
              onPointerEnter={event => { if (event.pointerType === 'mouse') setFocused(index); }}>
              <motion.span className="dt-bar" initial={false} animate={{ scaleY: value / 100 }} />
            </button>
          ))}
        </div>
      </div>
      <div className="dt-chart-caption"><span>Period 1</span><output>Period {current + 1} · {(values[current] * 20).toLocaleString('en-UG')} sessions</output><span>Period 12</span></div>
    </section>
  );
}

function ActivityTable({ records, onPick, heading }: { records: RecordItem[]; onPick: (record: RecordItem) => void; heading: string }) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const visible = records.filter(item => [item.name, item.product, item.status].some(value => value.toLowerCase().includes(query)));
  return (
    <section className="dt-panel dt-records" aria-label={heading}>
      <div className="dt-card-heading">
        <div><h2>{heading}</h2><p>Sample organisations and product activity</p></div>
        <label className="dt-search"><Search size={16} aria-hidden="true" />
          <input type="search" name="activity-search" aria-label="Search sample records" placeholder="Search records…" value={search} onChange={event => setSearch(event.target.value)} />
        </label>
      </div>
      {visible.length ? <div className="dt-table-scroll"><table>
        <caption className="dt-sr">{heading}</caption>
        <thead><tr><th scope="col">Organisation</th><th scope="col">Product</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span className="dt-sr">Details</span></th></tr></thead>
        <tbody>{visible.map(record => <tr key={record.id}>
          <th scope="row"><span className="dt-org"><i>{record.name.slice(0, 2).toUpperCase()}</i>{record.name}</span></th>
          <td>{record.product}</td><td><span className="dt-status" data-status={record.status}>{record.status}</span></td>
          <td>{record.date}</td><td><button type="button" className="dt-icon dt-row-button" aria-label={`Details for ${record.name}`} onClick={() => onPick(record)}><ArrowRight size={17} aria-hidden="true" /></button></td>
        </tr>)}</tbody>
      </table></div> : <div className="dt-empty" role="status"><Search size={23} aria-hidden="true" /><h3>No matching records</h3><p>Try an organisation, product, or status.</p><button type="button" className="dt-button" onClick={() => setSearch('')}>Clear search</button></div>}
    </section>
  );
}

function WorkspaceDialog({ kind, onClose, onAdd }: { kind: RecordItem | 'new' | 'guide'; onClose: () => void; onAdd: (name: string, product: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    const lastFocus = document.activeElement;
    node?.showModal();
    return () => {
      clearTimeout(timer.current);
      node?.close();
      if (lastFocus instanceof HTMLElement) lastFocus.focus();
    };
  }, []);
  const dismiss = () => {
    if (closing) return;
    if (reduced) { onClose(); return; }
    setClosing(true);
    timer.current = setTimeout(onClose, 160);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (closing) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('organisation')).trim();
    if (!name) return;
    onAdd(name, String(data.get('product')));
    dismiss();
  };
  const title = kind === 'new' ? 'New activity' : kind === 'guide' ? 'About this workspace' : kind.name;
  return (
    <dialog ref={dialog} className="dt-dialog" aria-labelledby="dt-dialog-title" onCancel={event => { event.preventDefault(); dismiss(); }}>
      <motion.div initial={reduced ? false : { opacity: 0, y: 10 }} animate={closing ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}>
        <div className="dt-card-heading"><h2 id="dt-dialog-title">{title}</h2><button className="dt-icon" aria-label="Close dialog" type="button" onClick={dismiss}><X size={20} aria-hidden="true" /></button></div>
        {kind === 'new' ? <form className="dt-form" onSubmit={submit}>
          <label>Organisation<input name="organisation" required maxLength={70} autoComplete="off" /></label>
          <label>Product<select name="product"><option>HotelOS</option><option>DayTech POS</option><option>DayTech Schools</option><option>Customer Portal</option></select></label>
          <button className="dt-button dt-primary" type="submit" disabled={closing}>Add sample activity</button>
        </form> : kind === 'guide' ? <p>Explore the sample analytics, change the date range, or add an activity. Changes stay in this browser tab until you reload.</p> :
          <dl className="dt-detail"><div><dt>Product</dt><dd>{kind.product}</dd></div><div><dt>Status</dt><dd>{kind.status}</dd></div><div><dt>Updated</dt><dd>{kind.date}</dd></div></dl>}
      </motion.div>
    </dialog>
  );
}

export function Workspace() {
  const [view, setView] = useState<View>('Overview');
  const [range, setRange] = useState<Range>('30');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [records, setRecords] = useState(initialRecords);
  const [dialog, setDialog] = useState<RecordItem | 'new' | 'guide' | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileMenu) return;
    const frame = requestAnimationFrame(() => sidebar.current?.querySelector<HTMLButtonElement>('nav button[aria-current]')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [mobileMenu]);
  const reduced = useReducedMotion();
  const values = periods[range];
  const stats = [
    { label: 'Active users', value: values.users, icon: Users, delta: '+12.8%' },
    { label: 'Sessions', value: values.sessions, icon: Activity, delta: '+8.4%' },
    { label: 'Conversion rate', value: values.rate, suffix: '%', icon: BarChart3, delta: '+1.2 pp' },
    { label: 'Avg. session', value: values.time, suffix: ' min', icon: Clock3, delta: '−0.4 min' },
  ];
  const closeMenu = () => {
    setMobileMenu(false);
    menuButton.current?.focus();
  };
  const move = (next: View) => {
    setView(next);
    if (mobileMenu) closeMenu();
  };
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}>
      <div className="dt-workspace" data-theme={dark ? 'dark' : 'light'} data-collapsed={collapsed} data-menu={mobileMenu}>
        <a className="dt-skip" href="#dt-main">Skip to content</a>
        <aside ref={sidebar} id="dt-sidebar" className="dt-sidebar" aria-label="Workspace sidebar" onKeyDown={event => { if (event.key === 'Escape' && mobileMenu) closeMenu(); }}>
          <div className="dt-brand"><span className="dt-mark"><Activity size={21} aria-hidden="true" /></span><span className="dt-nav-label">DayTech<small>Workspace</small></span></div>
          <nav aria-label="Workspace views">
            {nav.map(({ name, icon: Icon }) => <button type="button" key={name} aria-current={view === name ? 'page' : undefined} onClick={() => move(name)} aria-label={name}>
              {view === name && <motion.span className="dt-nav-active" layoutId="active-view" initial={false} />}
              <Icon size={19} aria-hidden="true" /><span className="dt-nav-label">{name}</span>
            </button>)}
          </nav>
          <div className="dt-sidebar-bottom">
            <button type="button" onClick={() => { if (mobileMenu) closeMenu(); setDialog('guide'); }} aria-label="Workspace guide"><CircleHelp size={19} aria-hidden="true" /><span className="dt-nav-label">Workspace guide</span></button>
            <button className="dt-collapse" type="button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>
              <PanelLeftClose size={19} aria-hidden="true" /><span className="dt-nav-label">Collapse</span>
            </button>
          </div>
        </aside>
        <div className="dt-content">
          <header className="dt-top">
            <div className="dt-crumb"><button ref={menuButton} type="button" className="dt-icon dt-mobile-menu" aria-expanded={mobileMenu} aria-controls="dt-sidebar" aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20} aria-hidden="true" /></button>
              <span>Workspace</span><span aria-hidden="true">/</span><strong>{view}</strong></div>
            <div className="dt-top-actions"><span className="dt-sample">Sample data</span>
              <button className="dt-icon" type="button" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}</button>
            </div>
          </header>
          <main className="dt-main" id="dt-main" tabIndex={-1}>
            <div className="dt-intro"><div><h1>{view === 'Overview' ? 'Workspace overview' : view}</h1>
              <p>{view === 'Overview' ? 'Track engagement and recent activity across DayTech products.' : view === 'Analytics' ? 'Explore session volume by reporting period.' : 'Browse the organisations in this sample workspace.'}</p></div>
              <div className="dt-actions">
                {(view === 'Overview' || view === 'Analytics') && <label className="dt-select"><CalendarDays size={17} aria-hidden="true" />
                  <select aria-label="Reporting period" name="reporting-period" value={range} onChange={event => setRange(event.target.value as Range)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><ChevronDown size={16} aria-hidden="true" /></label>}
                <motion.button type="button" className="dt-button dt-primary" whileTap={reduced ? undefined : { scale: 0.97 }} onClick={() => setDialog('new')}><Plus size={18} aria-hidden="true" /> New activity</motion.button>
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} className="dt-view" initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -4 }}>
                {view === 'Overview' && <section className="dt-stats" aria-label="Workspace statistics">{stats.map(({ label, value, suffix, icon: Icon, delta }) => (
                  <article className="dt-panel dt-stat" key={label}><div><span>{label}</span><Icon size={18} aria-hidden="true" /></div><strong><Counter value={value} suffix={suffix} /></strong>
                    <small>{delta.startsWith('−') ? <ArrowDownRight size={14} aria-hidden="true" /> : <ArrowUpRight size={14} aria-hidden="true" />}{delta}<span> vs. prior period</span></small></article>
                ))}</section>}
                {(view === 'Overview' || view === 'Analytics') && <EngagementChart range={range} />}
                {view !== 'Analytics' && <ActivityTable records={records} onPick={setDialog} heading={view === 'Customers' ? 'Customer accounts' : 'Recent activity'} />}
              </motion.div>
            </AnimatePresence>
            <p className="dt-sr" role="status">{announcement}</p>
          </main>
        </div>
        {dialog && <WorkspaceDialog kind={dialog} onClose={() => setDialog(null)} onAdd={(name, product) => {
          setRecords(items => [{ id: Date.now(), name, product, status: 'Pending', date: 'Today' }, ...items]);
          setAnnouncement('Sample activity added.');
        }} />}
      </div>
    </MotionConfig>
  );
}
