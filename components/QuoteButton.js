'use client';

export default function QuoteButton({ text = "Get a Free Quote", className = "btn-primary", style = {}, eventName = "openGlobalInquiry" }) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(eventName));
    }
  };

  return (
    <button className={className} style={style} onClick={handleClick}>
      {text}
    </button>
  );
}
