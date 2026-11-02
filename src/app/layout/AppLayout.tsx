import { Drawer } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import clsx from '@/utils/clsx';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import styles from './AppLayout.module.scss';

const COLLAPSE_KEY = 'cag-sd:sidebar-collapsed';

// Per-browser UI preference; storage may be unavailable (private mode).
const readCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        // ignore: the preference just won't persist
      }
      return !c;
    });

  return (
    <div className={clsx(styles.shell, collapsed && styles.collapsed)}>
      <a href="#main" className={styles.skip}>
        Saltar al contenido
      </a>
      <aside className={styles.aside}>
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </aside>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 248, boxShadow: '0 8px 24px rgba(17,24,39,0.12)' } } }}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </Drawer>
      <div className={styles.main}>
        <Header onMenu={() => setOpen(true)} />
        <main id="main" className={styles.content} tabIndex={-1}>
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}
