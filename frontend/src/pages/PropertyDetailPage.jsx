import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import ReCAPTCHA from "react-google-recaptcha";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { getPublicProperty, sendPropertyContact } from "../api/publicPropertiesApi";
import { useAuth } from "../context/AuthContext";
import { getBackendBaseUrl } from "../utils/backendBaseUrl";

const mapMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function formatAgentName(agent) {
  if (!agent) {
    return "Nao atribuido";
  }

  const fullName = [agent.firstName, agent.lastName].filter(Boolean).join(" ").trim();
  return fullName || agent.email;
}

function parseCoordinates(rawAddressMap) {
  const raw = String(rawAddressMap || "").trim();
  if (!raw) {
    return null;
  }

  const match = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  const latitude = Number.parseFloat(match[1]);
  const longitude = Number.parseFloat(match[2]);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return [latitude, longitude];
}

function PropertyDetailPage() {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const recaptchaRef = useRef(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactFeedback, setContactFeedback] = useState("");
  const [contactError, setContactError] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    senderName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    senderEmail: user?.email || "",
    senderPhone: "",
    objective: "pedir_informacoes",
    messageText: "",
    recaptchaToken: "",
    acceptPrivacyPolicy: false,
  });

  const propertyUrl = useMemo(() => {
    if (!property?.id) {
      return "";
    }

    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/imoveis/${property.id}`;
    }

    return `/imoveis/${property.id}`;
  }, [property?.id]);

  const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

  const mainImage = useMemo(() => {
    if (!property?.images?.length) {
      return null;
    }

    return (
      property.images.find((image) => image.isMain) ||
      [...property.images].sort((a, b) => a.id - b.id)[0]
    );
  }, [property?.images]);

  const ogImageUrl = useMemo(() => {
    if (!mainImage?.imageUrl) {
      return "";
    }

    return `${backendBaseUrl}${mainImage.imageUrl}`;
  }, [backendBaseUrl, mainImage?.imageUrl]);

  const locationCoordinates = useMemo(() => parseCoordinates(property?.addressMap), [property?.addressMap]);

  const googleMapsSearchUrl = useMemo(() => {
    const query = String(property?.addressMap || "").trim();
    if (!query) {
      return "";
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }, [property?.addressMap]);

  const facebookShareUrl = useMemo(() => {
    if (!propertyUrl) {
      return "";
    }
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
  }, [propertyUrl]);

  const xShareUrl = useMemo(() => {
    if (!propertyUrl || !property) {
      return "";
    }

    const text = `${property.title} - ${property.price} EUR`;
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(text)}`;
  }, [property, propertyUrl]);

  const whatsappShareUrl = useMemo(() => {
    if (!propertyUrl || !property) {
      return "";
    }

    const text = `${property.title} - ${property.price} EUR`;
    return `https://wa.me/?text=${encodeURIComponent(`${text} ${propertyUrl}`)}`;
  }, [property, propertyUrl]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setContactForm((prev) => ({
      ...prev,
      senderName: prev.senderName || `${user.firstName} ${user.lastName}`.trim(),
      senderEmail: prev.senderEmail || user.email,
    }));
  }, [user]);

  useEffect(() => {
    if (contactForm.messageText.trim()) {
      return;
    }

    const defaultMessage =
      contactForm.objective === "agendar_visita"
        ? "Solicita-se o agendamento de visita a este imovel."
        : contactForm.objective === "pedir_informacoes"
          ? "Solicita-se o envio de informacoes adicionais sobre este imovel."
          : "Regista-se interesse neste imovel e solicita-se contacto.";

    setContactForm((prev) => ({
      ...prev,
      messageText: defaultMessage,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactForm.objective]);

  useEffect(() => {
    async function loadProperty() {
      try {
        setLoading(true);
        setError("");

        const response = await getPublicProperty(propertyId);
        setProperty(response.property || null);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Nao foi possivel carregar o detalhe do imovel.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  if (loading) {
    return <p>A carregar detalhe do imovel...</p>;
  }

  if (error) {
    return (
      <section className="card">
        <p className="error">{error}</p>
        <Link className="btn btn-secondary" to="/imoveis">
          Regressar ao catalogo
        </Link>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="card">
        <p>O imovel solicitado nao foi encontrado.</p>
        <Link className="btn btn-secondary" to="/imoveis">
          Regressar ao catalogo
        </Link>
      </section>
    );
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    setContactError("");
    setContactFeedback("");

    if (!recaptchaSiteKey) {
      setContactError("A variavel VITE_RECAPTCHA_SITE_KEY deve ser configurada no frontend para ativacao do formulario.");
      return;
    }

    if (!contactForm.recaptchaToken) {
      setContactError("A validacao do reCAPTCHA e obrigatoria antes do envio.");
      return;
    }

    if (!contactForm.acceptPrivacyPolicy) {
      setContactError("A aceitacao da politica de privacidade e obrigatoria para envio do contacto.");
      return;
    }

    try {
      setSendingContact(true);
      const response = await sendPropertyContact(property.id, contactForm);
      setContactFeedback(response.message || "A mensagem foi enviada com sucesso.");
      setContactForm((prev) => ({
        ...prev,
        senderPhone: "",
        objective: "pedir_informacoes",
        messageText: "Solicita-se o envio de informacoes adicionais sobre este imovel.",
        recaptchaToken: "",
        acceptPrivacyPolicy: false,
      }));

      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (requestError) {
      setContactError(requestError?.response?.data?.message || "Nao foi possivel enviar a mensagem.");
    } finally {
      setSendingContact(false);
    }
  }

  async function handleCopyLink() {
    if (!propertyUrl || !navigator?.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(propertyUrl);
      setContactFeedback("O link do imovel foi copiado para a area de transferencia.");
    } catch (copyError) {
      setContactError("Nao foi possivel copiar o link de forma automatica.");
    }
  }

  return (
    <>
      <Helmet>
        <title>{`${property.title} | Imobiliaria Site`}</title>
        <meta name="description" content={String(property.description || "").slice(0, 160)} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${property.title} | Imobiliaria Site`} />
        <meta property="og:description" content={String(property.description || "").slice(0, 200)} />
        <meta property="og:url" content={propertyUrl} />
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      </Helmet>

      <section className="property-detail-page">
        <div className="card">
        <div className="actions">
          <Link className="btn btn-secondary" to="/imoveis">
            Regressar ao catalogo
          </Link>
        </div>

        <h1>{property.title}</h1>
        <p>{property.description}</p>

        <div className="detail-grid">
          <p>
            <strong>Objetivo:</strong> {property.objective}
          </p>
          <p>
            <strong>Tipo:</strong> {property.propertyType}
          </p>
          <p>
            <strong>Estado:</strong> {property.status}
          </p>
          <p>
            <strong>Preco:</strong> {property.price} EUR
          </p>
          <p>
            <strong>Tipologia:</strong> T{property.rooms}
          </p>
          <p>
            <strong>WCs:</strong> {property.bathrooms}
          </p>
          <p>
            <strong>Area util:</strong> {property.usefulArea} m2
          </p>
          <p>
            <strong>Area bruta:</strong> {property.grossArea} m2
          </p>
          <p>
            <strong>Area bruta privativa:</strong> {property.privativeGrossArea} m2
          </p>
          <p>
            <strong>Area lote:</strong> {property.lotArea || "-"}
          </p>
          <p>
            <strong>Ano:</strong> {property.buildYear || "-"}
          </p>
          <p>
            <strong>Piso:</strong> {property.floor || "-"}
          </p>
          <p>
            <strong>Elevador:</strong> {property.elevator ? "Sim" : "Nao"}
          </p>
          <p>
            <strong>Estacionamento:</strong> {property.parkingSpaces}
          </p>
          <p>
            <strong>Carregamento EV:</strong> {property.evCharging ? "Sim" : "Nao"}
          </p>
          <p>
            <strong>Energia:</strong> {property.energyCert}
          </p>
          <p>
            <strong>Localizacao:</strong> {property.district}, {property.county}, {property.parish}
          </p>
          <p>
            <strong>Morada/Mapa:</strong> {property.addressMap}
          </p>
          {typeof property.viewsCount === "number" && (
            <p>
              <strong>Visualizacoes:</strong> {property.viewsCount}
            </p>
          )}
        </div>
        </div>

        <div className="card">
          <h2>Partilhar Imovel</h2>
          <p>Este anuncio pode ser partilhado nas redes sociais da imobiliaria.</p>
          <div className="actions">
            <a className="btn btn-secondary" href={facebookShareUrl} target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a className="btn btn-secondary" href={xShareUrl} target="_blank" rel="noreferrer">
              X / Twitter
            </a>
            <a className="btn btn-secondary" href={whatsappShareUrl} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <button className="btn btn-secondary" type="button" onClick={handleCopyLink}>
              Copiar link
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Localizacao em mapa</h2>
          {locationCoordinates ? (
            <MapContainer center={locationCoordinates} zoom={15} scrollWheelZoom={false} className="map-container">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={locationCoordinates} icon={mapMarkerIcon}>
                <Popup>{property.title}</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <p>
              Nao existem coordenadas validas no campo morada/mapa.
              {googleMapsSearchUrl && (
                <>
                  {" "}
                  <a href={googleMapsSearchUrl} target="_blank" rel="noreferrer">
                    Abrir pesquisa no mapa
                  </a>
                </>
              )}
            </p>
          )}
        </div>

        <div className="card">
        <h2>Galeria</h2>
        {property.images?.length ? (
          <div className="detail-images-grid">
            {property.images.map((image) => (
              <img
                key={image.id}
                src={`${backendBaseUrl}${image.imageUrl}`}
                alt={property.title}
                loading="lazy"
                className={image.isMain ? "detail-image main" : "detail-image"}
              />
            ))}
          </div>
        ) : (
          <p>Nao existem imagens disponiveis.</p>
        )}
        </div>

        <div className="card">
        <h2>Divisoes</h2>
        {property.divisions?.length ? (
          <ul className="detail-list">
            {property.divisions.map((division) => (
              <li key={division.id}>
                {division.name} {division.area ? `- ${division.area} m2` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nao existem divisoes registadas.</p>
        )}
        </div>

        <div className="card">
        <h2>Responsavel</h2>
        <p>
          <strong>Agente:</strong> {formatAgentName(property.agent)}
        </p>
        <p>
          <strong>Email:</strong> {property.agent?.email || "Nao disponivel"}
        </p>
        </div>

        <div className="card">
        <h2>Formulario de Contacto</h2>
        <p>Este formulario permite o envio de mensagem ao responsavel pelo imovel.</p>

        <form className="form" onSubmit={handleContactSubmit}>
          <div className="grid-2">
            <div>
              <label htmlFor="senderName">Nome</label>
              <input
                id="senderName"
                value={contactForm.senderName}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, senderName: event.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="senderEmail">Email</label>
              <input
                id="senderEmail"
                type="email"
                value={contactForm.senderEmail}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, senderEmail: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label htmlFor="senderPhone">Telefone (opcional)</label>
              <input
                id="senderPhone"
                value={contactForm.senderPhone}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, senderPhone: event.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="objective">Objetivo do contacto</label>
              <select
                id="objective"
                value={contactForm.objective}
                onChange={(event) =>
                  setContactForm((prev) => ({
                    ...prev,
                    objective: event.target.value,
                    messageText: "",
                  }))
                }
              >
                <option value="pedir_informacoes">Solicitar informacoes</option>
                <option value="agendar_visita">Solicitar agendamento de visita</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <label htmlFor="messageText">Mensagem</label>
          <textarea
            id="messageText"
            rows={5}
            value={contactForm.messageText}
            onChange={(event) =>
              setContactForm((prev) => ({ ...prev, messageText: event.target.value }))
            }
          />

          <label className="checkbox">
            <input
              type="checkbox"
              checked={contactForm.acceptPrivacyPolicy}
              onChange={(event) =>
                setContactForm((prev) => ({
                  ...prev,
                  acceptPrivacyPolicy: event.target.checked,
                }))
              }
            />
            E declarada a aceitacao da <Link to="/politica-privacidade">politica de privacidade</Link> e do tratamento de dados.
          </label>

          {recaptchaSiteKey ? (
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={recaptchaSiteKey}
              onChange={(token) =>
                setContactForm((prev) => ({ ...prev, recaptchaToken: token || "" }))
              }
            />
          ) : (
            <p className="error">
              reCAPTCHA nao configurado. A variavel VITE_RECAPTCHA_SITE_KEY deve ser definida no frontend.
            </p>
          )}

          <button className="btn" type="submit" disabled={sendingContact}>
            {sendingContact ? "A enviar..." : "Enviar mensagem"}
          </button>
        </form>

        {contactFeedback && <p className="success">{contactFeedback}</p>}
        {contactError && <p className="error">{contactError}</p>}
        </div>
      </section>
    </>
  );
}

export default PropertyDetailPage;
