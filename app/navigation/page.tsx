import { AudioLines, Layers, MoveHorizontal } from "lucide-react";

export default function NavigationHome() {
  return (
    <>
      <span className="navlab-kicker">Study 002 / Independent surfaces</span>
      <h1 className="navlab-h1">The shell remembers.</h1>
      <p className="navlab-lede">Open the menu. Navigate between routes. The same sidebar, same dock, and same motion controller stay mounted. Only this content changes.</p>
      <div className="navlab-cards">
        <div className="navlab-card"><Layers size={22} className="navlab-card-icon"/><div><strong>One shell</strong><span style={{display:"block",marginTop:5}}>Different pages, same surfaces.</span></div></div>
        <div className="navlab-card"><MoveHorizontal size={22} className="navlab-card-icon"/><div><strong>Reversible</strong><span style={{display:"block",marginTop:5}}>Open, interrupt, return.</span></div></div>
        <div className="navlab-card"><AudioLines size={22} className="navlab-card-icon"/><div><strong>Responsive</strong><span style={{display:"block",marginTop:5}}>Touch-friendly and reduced motion.</span></div></div>
      </div>
    </>
  );
}
