import { Bookmark, Disc, ListMusic } from "lucide-react";

export default function NavigationLibrary() {
  return (
    <>
      <span className="navlab-kicker">Context / Library</span>
      <h1 className="navlab-h1">Keep what moves you.</h1>
      <p className="navlab-lede">This is an independent route, not a conditional div inside one page. The persistent dock stays in the same React layout.</p>
      <div className="navlab-cards">
        <div className="navlab-card"><Bookmark size={23} className="navlab-card-icon"/><div><strong>Saved</strong><span style={{display:"block",marginTop:5}}>A place for memory.</span></div></div>
        <div className="navlab-card"><Disc size={23} className="navlab-card-icon"/><div><strong>Albums</strong><span style={{display:"block",marginTop:5}}>Quiet by design.</span></div></div>
        <div className="navlab-card"><ListMusic size={23} className="navlab-card-icon"/><div><strong>Queue</strong><span style={{display:"block",marginTop:5}}>No navigation resets.</span></div></div>
      </div>
    </>
  );
}
