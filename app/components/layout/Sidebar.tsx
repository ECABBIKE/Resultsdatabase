import Link from 'next/link';
import './sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>GravitySeries</h2>
      <nav>
        <ul>
          <li><Link href="/series/GSE">GSE Dashboard</Link></li>
          <li><Link href="/series/GSE/events">Deltävlingar</Link></li>
          <li><Link href="/series/GSE/standings">Poängställning</Link></li>
          <li><Link href="/series/GSE/teams">Team-ranking</Link></li>
        </ul>
      </nav>
    </aside>
  );
}
