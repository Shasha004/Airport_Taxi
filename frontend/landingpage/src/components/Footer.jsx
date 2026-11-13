import '../css/Footer.css';

function Footer({ activeSlide, onSlideChange, onMoreClick }) {
  const totalSlides = 5;

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              className={i === activeSlide ? 'footer__dot footer__dot--active' : 'footer__dot'}
              onClick={() => onSlideChange(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button className="footer__more" onClick={onMoreClick}>
          Book Now <span>→</span>
        </button>
      </div>
    </footer>
  );
}

export default Footer;
