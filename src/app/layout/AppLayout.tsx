import { Drawer } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Saltar al contenido
      </a>
      <aside className={styles.aside}>
        <Sidebar />
      </aside>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 280, border: 'none', boxShadow: 'none' } } }}
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
