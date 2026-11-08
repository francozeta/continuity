import { Search, Waves, Compass } from "lucide-react";

export default function NavigationSearch() {
  return (
    <>
      <span className="navlab-kicker">Context / Discovery</span>
      <h1 className="navlab-h1">Find something unexpected.</h1>
      <p className="navlab-lede">The separate Search capsule expands into an input without replacing the dock. Type something, leave this route, and return: its query should persist.</p>
      <div className="navlab-cards">
        <div className="navlab-card"><Search size={23} className="navlab-card-icon"/><div><strong>Look closer</strong><span style={{display:"block",marginTop:5}}>One continuous search surface.</span></div></div>
        <div className="navlab-card"><Waves size={23} className="navlab-card-icon"/><div><strong>Atmosphere</strong><span style={{display:"block",marginTop:5}}>No synthetic page transitions.</span></div></div>
        <div className="navlab-card"><Compass size={23} className="navlab-card-icon"/><div><strong>Discover</strong><span style={{display:"block",marginTop:5}}>Motion supports the task.</span></div></div>
      </div>
    </>
  );
}
