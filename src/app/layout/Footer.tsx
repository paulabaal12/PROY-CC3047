import aecidLogo from '@/assets/logos/aecid.png';
import uvgLogo from '@/assets/logos/uvg.png';
import styles from './Footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        Service Desk del <em>Catálogo Centroamericano de Videojuegos</em> · CC3047 Administración y
        Mantenimiento de Sistemas · Datos de demostración ficticios.
      </p>
      <div className={styles.logos}>
        <img src={uvgLogo} alt="Universidad del Valle de Guatemala" height={36} />
        <img src={aecidLogo} alt="AECID — Cooperación Española" height={36} />
      </div>
    </footer>
  );
}
