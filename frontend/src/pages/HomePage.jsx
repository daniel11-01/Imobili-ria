import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import slidePlaceholderOne from "../assets/slide-placeholder-1.svg";
import slidePlaceholderTwo from "../assets/slide-placeholder-2.svg";
import slidePlaceholderThree from "../assets/slide-placeholder-3.svg";
import CatalogPage from "./CatalogPage";

const CAROUSEL_SLIDES = [
  {
    id: "definicao",
    image: slidePlaceholderOne,
    alt: "Slide de abertura da marca EURODITEPRELUDE.",
    heading: "Definição",
    copy:
      "Marca que representa o início estratégico de projetos e experiências, unindo visão integradora, conhecimento, estética e espírito de descoberta.",
  },
  {
    id: "missao-visao",
    image: slidePlaceholderTwo,
    alt: "Slide sobre missão e visão da marca.",
    heading: "Missão e Visão",
    copy:
      "Criar soluções e experiências que contribuem para novos projetos de vida, investimento e descoberta, tornando-se referência na criação de percursos entre investimento, aventura e espaço.",
  },
  {
    id: "slogan",
    image: slidePlaceholderThree,
    alt: "Slide final com slogan da marca.",
    heading: "Slogan",
    copy: "A Chave que abre portas e que revela novos caminhos.",
  },
];

const BRAND_VALUES = [
  "Visão estratégica",
  "Liberdade responsável",
  "Conhecimento aplicado",
  "Estética com função",
  "Autenticidade",
  "Confiança",
  "Espírito de descoberta",
];

function HomePage() {
  const location = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 7000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const hashTarget = location.hash ? location.hash.slice(1) : "";
    if (!hashTarget) {
      return;
    }

    const element = document.getElementById(hashTarget);
    if (!element) {
      return;
    }

    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  function goToSlide(nextIndex) {
    const normalized = (nextIndex + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length;
    setActiveSlide(normalized);
  }

  function scrollToCatalog() {
    const catalogSection = document.getElementById("catalogo");
    if (!catalogSection) {
      return;
    }

    catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="home-page landing-page modern-page">
      <header className="card page-hero landing-intro">
        <p className="page-hero-badge">Plataforma Imobiliária</p>
        <h1>Experiência digital simples, moderna e orientada à decisão</h1>
        <p className="hero-copy">
          A plataforma organiza pesquisa, comparação e contacto em percursos claros,
          com uma interface visualmente forte e foco total na clareza da informação.
        </p>
        <div className="actions landing-actions">
          <button className="btn" type="button" onClick={scrollToCatalog}>
            Explorar catálogo
          </button>
          <Link className="btn btn-secondary" to="/imoveis">
            Abrir vista dedicada
          </Link>
        </div>
      </header>

      <div className="landing-split">
        <section id="sobre-nos" className="card hero-carousel" aria-label="Sobre nós">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {CAROUSEL_SLIDES.map((slide) => (
              <article key={slide.id} className="carousel-slide" aria-hidden={slide.id !== CAROUSEL_SLIDES[activeSlide].id}>
                <img className="carousel-image" src={slide.image} alt={slide.alt} />
                <div className="carousel-overlay">
                  <p className="eyebrow">EURODITEPRELUDE</p>
                  <h2>{slide.heading}</h2>
                  <p className="hero-copy">{slide.copy}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="carousel-controls">
            <button className="btn btn-secondary" type="button" onClick={() => goToSlide(activeSlide - 1)}>
              Anterior
            </button>

            <div className="carousel-dots" aria-label="Selecionar slide">
              {CAROUSEL_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={index === activeSlide ? "carousel-dot active" : "carousel-dot"}
                  onClick={() => goToSlide(index)}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>

            <button className="btn btn-secondary" type="button" onClick={() => goToSlide(activeSlide + 1)}>
              Seguinte
            </button>
          </div>
        </section>

        <section className="card brand-manifesto" aria-label="Manifesto da marca">
          <div className="brand-manifesto-header">
            <h2>EURODITEPRELUDE</h2>
            <p className="manifesto-slogan">A Chave que abre portas e que revela novos caminhos.</p>
          </div>

          <div className="brand-manifesto-grid">
            <article className="manifesto-block">
              <h3>Missão</h3>
              <p>
                Criar soluções e experiências que contribuem para novos projetos de vida,
                investimento e descoberta.
              </p>
            </article>

            <article className="manifesto-block">
              <h3>Visão</h3>
              <p>
                Ser uma marca de referência na criação de percursos entre investimento,
                aventura e espaço.
              </p>
            </article>

            <article className="manifesto-block manifesto-values">
              <h3>Valores</h3>
              <ul className="values-list">
                {BRAND_VALUES.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </div>

      <section id="catalogo" className="catalog-anchor" aria-label="Catálogo público">
        <CatalogPage embedded />
      </section>
    </section>
  );
}

export default HomePage;
