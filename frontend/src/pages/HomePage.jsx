import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import slidePlaceholderOne from "../assets/slide-placeholder-1.svg";
import slidePlaceholderTwo from "../assets/slide-placeholder-2.svg";
import slidePlaceholderThree from "../assets/slide-placeholder-3.svg";
import CatalogPage from "./CatalogPage";

const CAROUSEL_SLIDES = [
  {
    id: "definicao",
    image: slidePlaceholderOne,
    alt: "Slide de abertura da marca ERUDITEPRELUDE.",
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

const INCLUDED_SERVICES = [
  "Avaliação Patrimonial Profissional com Análise Profunda do Mercado",
  "Preparação Estratégica do Imóvel para Exposição",
  "Produção de Foto-reportagem e Vídeo de Elite por Especialistas",
  "Divulgação Exclusiva em Plataformas Digitais Nacionais e Internacionais de Prestígio",
  "Execução de Programas de Marketing e Vendas Personalizados de Excelência",
  "Identificação e Seleção Criteriosa de Investidores Qualificados com Solvência Bancária e Condições Preferenciais",
  "Partilha em Rede com Parceiros Credíveis",
  "Gestão de Relacionamento e Informação Periódica para o Cliente",
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

  return (
    <section className="home-page landing-page modern-page">
      <header className="card page-hero landing-intro">
        <div className="landing-hero-grid">
          <div>
            <h1>Experiência digital simples, moderna e orientada à decisão</h1>
            <p className="hero-copy">
              A plataforma organiza pesquisa, comparação e contacto em percursos claros,
              com uma interface visualmente forte e foco total na clareza da informação.
            </p>
          </div>
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
                  <p className="eyebrow">ERUDITEPRELUDE</p>
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

        <section className="card brand-manifesto services-panel" aria-label="Serviços incluídos">
          <div className="brand-manifesto-header">
            <h2>ERUDITEPRELUDE</h2>
            <p className="manifesto-slogan">Serviços incluídos</p>
          </div>

          <ol className="services-list">
            {INCLUDED_SERVICES.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ol>
        </section>
      </div>

      <section id="catalogo" className="catalog-anchor" aria-label="Catálogo público">
        <CatalogPage embedded />
      </section>
    </section>
  );
}

export default HomePage;
