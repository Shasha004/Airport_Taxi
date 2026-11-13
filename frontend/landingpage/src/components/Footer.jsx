import React from 'react';
import '../css/Footer.css';

/**
 * Footer Component matching the bottom bar of Image 2 (AirportCarWala).
 * Elements: Social channel links, carousel dots, circular arrow buttons, and 'More'.
 */
function Footer({ activeSlide = 2, onSlideChange, onMoreClick }) {
  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Social channels (Left) */}
        <div className="footer__socials">
          <a href="#twitter" className="footer__social-link">Twitter</a>
          <span className="footer__divider">|</span>
          <a href="#facebook" className="footer__social-link">Facebook</a>
          <span className="footer__divider">|</span>
          <a href="#youtube" className="footer__social-link">Youtube</a>
        </div>

        {/* Carousel indicator dots (Center) matching • • ○ • • from Image 2 */}
        <div className="footer__pagination">
          {[0, 1, 2, 3, 4].map((index) => {
            const isRingDot = index === activeSlide;
            return (
              <button
                key={index}
                type="button"
                className={`footer__dot ${isRingDot ? 'footer__dot--ring' : 'footer__dot--solid'}`}
                onClick={() => onSlideChange && onSlideChange(index)}
                aria-label={`Select vehicle option ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Arrow Navigation & More (Right) */}
        <div className="footer__controls">
          <button 
            type="button" 
            className="footer__arrow-btn" 
            onClick={() => onSlideChange && onSlideChange((activeSlide - 1 + 5) % 5)}
            aria-label="Previous slide"
          >
            &#x2039;
          </button>
          <button 
            type="button" 
            className="footer__arrow-btn" 
            onClick={() => onSlideChange && onSlideChange((activeSlide + 1) % 5)}
            aria-label="Next slide"
          >
            &#x203A;
          </button>
          <button type="button" onClick={onMoreClick} className="footer__more-link">
            More
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
