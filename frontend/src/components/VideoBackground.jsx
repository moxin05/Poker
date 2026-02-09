import "./VideoBackground.css";

export default function VideoBackground({ src }) {
  return (
    <div className="videoBg">
      <video
        className="videoBg__video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src={src}
      />
      <div className="videoBg__overlay" />
    </div>
  );
}

