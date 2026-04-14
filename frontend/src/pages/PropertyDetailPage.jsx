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
    return "Não atribuído";
  }

  const fullName = [agent.firstName, agent.lastName].filter(Boolean).join(" ").trim();
  return fullName || agent.email;
}

function getAgentAvatarSrc(agent, backendBaseUrl) {
  const source = String(agent?.avatarUrl || "").trim();
  if (!source) {
    return "";
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  return `${backendBaseUrl}${source}`;
}

function parseCoordinates(property) {
  const latitudeFromField = Number.parseFloat(property?.latitude);
  const longitudeFromField = Number.parseFloat(property?.longitude);

  if (Number.isFinite(latitudeFromField) && Number.isFinite(longitudeFromField)) {
    if (
      latitudeFromField >= -90 &&
      latitudeFromField <= 90 &&
      longitudeFromField >= -180 &&
      longitudeFromField <= 180
    ) {
      return [latitudeFromField, longitudeFromField];
    }
  }

  const raw = String(property?.addressMap || "").trim();
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

  const locationCoordinates = useMemo(() => parseCoordinates(property), [property]);
  const agentAvatarSrc = useMemo(
    () => getAgentAvatarSrc(property?.agent, backendBaseUrl),
    [backendBaseUrl, property?.agent]
  );

  const googleMapsLocationUrl = useMemo(() => {
    if (locationCoordinates) {
      const [latitude, longitude] = locationCoordinates;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
    }

    const query = String(property?.addressMap || "").trim();
    if (!query) {
      return "";
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }, [locationCoordinates, property?.addressMap]);

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
        ? "Solicita-se o agendamento de visita a este imóvel."
        : contactForm.objective === "pedir_informacoes"
          ? "Solicita-se o envio de informações adicionais sobre este imóvel."
          : "Regista-se interesse neste imóvel e solicita-se contacto.";

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
        setError(requestError?.response?.data?.message || "Não foi possível carregar o detalhe do imóvel.");
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  if (loading) {
    return <p>A carregar detalhe do imóvel...</p>;
  }

  if (error) {
    return (
      <section className="card">
        <p className="error">{error}</p>
        <Link className="btn btn-secondary" to="/imoveis">
          Regressar ao catálogo
        </Link>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="card">
        <p>O imóvel solicitado não foi encontrado.</p>
        <Link className="btn btn-secondary" to="/imoveis">
          Regressar ao catálogo
        </Link>
      </section>
    );
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    setContactError("");
    setContactFeedback("");

    if (!recaptchaSiteKey) {
      setContactError("A variável VITE_RECAPTCHA_SITE_KEY deve ser configurada no frontend para ativação do formulário.");
      return;
    }

    if (!contactForm.recaptchaToken) {
      setContactError("A validação do reCAPTCHA é obrigatória antes do envio.");
      return;
    }

    if (!contactForm.acceptPrivacyPolicy) {
      setContactError("A aceitação da política de privacidade é obrigatória para envio do contacto.");
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
        messageText: "Solicita-se o envio de informações adicionais sobre este imóvel.",
        recaptchaToken: "",
        acceptPrivacyPolicy: false,
      }));

      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (requestError) {
      setContactError(requestError?.response?.data?.message || "Não foi possível enviar a mensagem.");
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
      setContactFeedback("O link do imóvel foi copiado para a área de transferência.");
    } catch (copyError) {
      setContactError("Não foi possível copiar o link de forma automática.");
    }
  }

  return (
    <>
      <Helmet>
        <title>{`${property.title} | Imobiliaria Site`}</title>
        <meta name="description" content={String(property.description || "").slice(0, 160)} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${property.title} | Imobiliária Site`} />
        <meta property="og:description" content={String(property.description || "").slice(0, 200)} />
        <meta property="og:url" content={propertyUrl} />
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
      </Helmet>

      <section className="property-detail-page modern-page">
        <div className="card detail-primary-card">
        <div className="actions">
          <Link className="btn btn-secondary" to="/imoveis">
            Regressar ao catálogo
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
            <strong>Preço:</strong> {property.price} EUR
          </p>
          <p>
            <strong>Tipologia:</strong> T{property.rooms}
          </p>
          <p>
            <strong>WCs:</strong> {property.bathrooms}
          </p>
          <p>
            <strong>Área útil:</strong> {property.usefulArea} m2
          </p>
          <p>
            <strong>Área bruta:</strong> {property.grossArea} m2
          </p>
          <p>
            <strong>Área bruta privativa:</strong> {property.privativeGrossArea} m2
          </p>
          <p>
            <strong>Área lote:</strong> {property.lotArea || "-"}
          </p>
          <p>
            <strong>Ano:</strong> {property.buildYear || "-"}
          </p>
          <p>
            <strong>Piso:</strong> {property.floor || "-"}
          </p>
          <p>
            <strong>Elevador:</strong> {property.elevator ? "Sim" : "Não"}
          </p>
          <p>
            <strong>Estacionamento:</strong> {property.parkingSpaces}
          </p>
          <p>
            <strong>Carregamento EV:</strong> {property.evCharging ? "Sim" : "Não"}
          </p>
          <p>
            <strong>Energia:</strong> {property.energyCert}
          </p>
          <p>
            <strong>Localização:</strong> {property.district}, {property.county}, {property.parish}
          </p>
          <p>
            <strong>Morada/Mapa:</strong> {property.addressMap}
          </p>
          {typeof property.viewsCount === "number" && (
            <p>
              <strong>Visualizações:</strong> {property.viewsCount}
            </p>
          )}
        </div>
        </div>

        {user?.role === "admin" && (
          <div className="card detail-share-card">
            <h2>Partilhar Imóvel</h2>
            <p>Este anúncio pode ser partilhado nas redes sociais da imobiliária.</p>
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
        )}

        <div className="card detail-map-card">
          <h2>Localização em mapa</h2>
          {locationCoordinates ? (
            <>
              <MapContainer
                center={locationCoordinates}
                zoom={15}
                scrollWheelZoom={false}
                className="map-container"
                eventHandlers={{
                  click: () => {
                    if (googleMapsLocationUrl) {
                      window.open(googleMapsLocationUrl, "_blank", "noopener,noreferrer");
                    }
                  },
                }}
              >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={locationCoordinates} icon={mapMarkerIcon}>
                <Popup>
                  <strong>{property.title}</strong>
                  <br />
                  <a href={googleMapsLocationUrl} target="_blank" rel="noreferrer">
                    Abrir no Google Maps
                  </a>
                </Popup>
              </Marker>
              </MapContainer>
              <p className="helper-text">Clique no mapa para abrir a localização no Google Maps.</p>
            </>
          ) : (
            <p>
              A localização será aberta por pesquisa da morada indicada no anúncio.
              {googleMapsLocationUrl && (
                <>
                  {" "}
                  <a href={googleMapsLocationUrl} target="_blank" rel="noreferrer">
                    Abrir no mapa
                  </a>
                </>
              )}
            </p>
          )}
        </div>

        <div className="card detail-gallery-card">
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
          <p>Não existem imagens disponíveis.</p>
        )}
        </div>

        <div className="card detail-divisions-card">
        <h2>Divisões</h2>
        {property.divisions?.length ? (
          <ul className="detail-list">
            {property.divisions.map((division) => (
              <li key={division.id}>
                {division.name} {division.area ? `- ${division.area} m2` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>Não existem divisões registadas.</p>
        )}
        </div>

        <div className="card detail-agent-card">
        <h2>Responsável</h2>
        <div className="responsavel-card">
          <div className="responsavel-avatar-wrap">
            {agentAvatarSrc ? (
              <img className="responsavel-avatar" src={agentAvatarSrc} alt={formatAgentName(property.agent)} />
            ) : (
              <div className="responsavel-avatar-fallback" aria-hidden="true">
                {formatAgentName(property.agent).slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="responsavel-meta">
            <p>
              <strong>Agente:</strong> {formatAgentName(property.agent)}
            </p>
            <p>
              <strong>Contacto:</strong> {property.agent?.publicPhone || "Não disponível"}
            </p>
            <p>
              <strong>Número profissional:</strong> {property.agent?.licenseNumber || "Não indicado"}
            </p>
          </div>
        </div>
        </div>

        <div className="card detail-contact-card">
        <h2>Formulário de Contacto</h2>
        <p>Este formulário permite o envio de mensagem ao responsável pelo imóvel.</p>

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
                <option value="pedir_informacoes">Solicitar informações</option>
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

          <div className="privacy-consent">
            <input
              id="acceptPrivacyPolicy"
              type="checkbox"
              checked={contactForm.acceptPrivacyPolicy}
              onChange={(event) =>
                setContactForm((prev) => ({
                  ...prev,
                  acceptPrivacyPolicy: event.target.checked,
                }))
              }
            />
            <label htmlFor="acceptPrivacyPolicy">
              É declarada a aceitação da <Link to="/politica-privacidade">política de privacidade</Link> e do tratamento de dados.
            </label>
          </div>

          {recaptchaSiteKey ? (
            <div className="recaptcha-wrap">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={(token) =>
                  setContactForm((prev) => ({ ...prev, recaptchaToken: token || "" }))
                }
                onErrored={() =>
                  setContactError(
                    "Falha no reCAPTCHA. Verifique se a VITE_RECAPTCHA_SITE_KEY corresponde ao domínio publicado no Render."
                  )
                }
                onExpired={() =>
                  setContactForm((prev) => ({ ...prev, recaptchaToken: "" }))
                }
              />
            </div>
          ) : (
            <p className="error">
              reCAPTCHA não configurado. A variável VITE_RECAPTCHA_SITE_KEY deve ser definida no frontend.
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
