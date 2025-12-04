import { useCarousel } from '../../../hooks/useCarousel';
import './Carousel.css';

const Carousel = ({ items }) => {
  const { currentIndex, goToNext, goToPrevious, goToSlide } = useCarousel(items);

  return (
    <div className="carousel">
      <div className="carousel-inner">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
          >
            <img src={item.url} alt={item.title} className="carousel-image" />
            <div className="carousel-overlay">
              <h2 className="carousel-title">{item.title}</h2>
              <p className="carousel-subtitle">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="carousel-btn carousel-btn-prev" onClick={goToPrevious}>
        &#10094;
      </button>
      <button className="carousel-btn carousel-btn-next" onClick={goToNext}>
        &#10095;
      </button>

      <div className="carousel-indicators">
        {items.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
