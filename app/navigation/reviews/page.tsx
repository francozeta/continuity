import { Star, MessageCircle, Heart } from "lucide-react";

export default function NavigationReviews() {
  return (
    <>
      <span className="navlab-kicker">Context / Reviews</span>
      <h1 className="navlab-h1">Every listen leaves a trace.</h1>
      <p className="navlab-lede">This route is a separate page. The sidebar and dock belong to the surrounding layout and keep their state.</p>
      <div className="navlab-cards">
        <div className="navlab-card"><Star size={23} className="navlab-card-icon"/><div><strong>Editorial notes</strong><span style={{display:"block",marginTop:5}}>Identity carries between contexts.</span></div></div>
        <div className="navlab-card"><MessageCircle size={23} className="navlab-card-icon"/><div><strong>Conversation</strong><span style={{display:"block",marginTop:5}}>Navigation does not restart.</span></div></div>
        <div className="navlab-card"><Heart size={23} className="navlab-card-icon"/><div><strong>Taste</strong><span style={{display:"block",marginTop:5}}>No new dock is created.</span></div></div>
      </div>
    </>
  );
}
