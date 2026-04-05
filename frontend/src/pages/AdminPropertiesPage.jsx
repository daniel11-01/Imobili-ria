import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAdminProperty,
  deleteAdminProperty,
  listAdminProperties,
} from "../api/adminPropertiesApi";
import { listAdminUsers } from "../api/adminUsersApi";

const defaultForm = {
  title: "",
  description: "",
  objective: "comprar",
  propertyType: "apartamento",
  status: "usado",
  price: "",
  district: "",
  county: "",
  parish: "",
  addressMap: "",
  rooms: "",
  bathrooms: "",
  usefulArea: "",
  grossArea: "",
  privativeGrossArea: "",
  lotArea: "",
  buildYear: "",
  floor: "",
  elevator: false,
  parkingSpaces: "0",
  evCharging: false,
  energyCert: "C",
  ownerId: "",
  agentId: "",
  divisionsText: "",
  images: [],
};

const PUBLIC_BASE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || "").trim();

function resolvePublicBaseUrl() {
  if (PUBLIC_BASE_URL) {
    return PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:5173";
}

function buildPropertyPublicUrl(propertyId) {
  return `${resolvePublicBaseUrl()}/imoveis/${propertyId}`;
}

function buildShareMessage(property, propertyUrl) {
  const location = [property.district, property.county, property.parish].filter(Boolean).join(" / ");
  const meta = [property.objective, property.propertyType, property.status].filter(Boolean).join(" | ");

  return [
    `${property.title}`,
    `${meta}`,
    `Preco: ${property.price} EUR`,
    `Localizacao: ${location}`,
    "",
    `Mais informacoes: ${propertyUrl}`,
    "#imobiliaria #imoveis",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function buildFacebookShareUrl(propertyUrl) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
}

function buildFacebookGroupsUrl(propertyUrl) {
  return `https://www.facebook.com/groups/feed/?link=${encodeURIComponent(propertyUrl)}`;
}

async function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document !== "undefined") {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }
}

function parseDivisionsText(divisionsText) {
  const lines = divisionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const [namePart, areaPart] = line.split(":");
    return {
      name: (namePart || "").trim(),
      area: areaPart ? Number.parseFloat(areaPart.trim()) : null,
    };
  });
}

function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState(defaultForm);

  async function loadProperties() {
    try {
      setLoading(true);
      const response = await listAdminProperties();
      setProperties(response);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Nao foi possivel carregar os imoveis.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsersForSelectors() {
    try {
      const [clientUsers, adminUsers] = await Promise.all([
        listAdminUsers({ role: "cliente" }),
        listAdminUsers({ role: "admin" }),
      ]);

      setClients(clientUsers);
      setAdmins(adminUsers);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Nao foi possivel carregar os utilizadores.");
    }
  }

  useEffect(() => {
    loadProperties();
    loadUsersForSelectors();
  }, []);

  function formatUserOption(user) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return `${fullName || "Sem nome"} (${user.email})`;
  }

  async function handleCreateProperty(event) {
    event.preventDefault();
    setError("");
    setFeedback("");

    try {
      setCreating(true);

      const payload = {
        ...createForm,
        divisions: parseDivisionsText(createForm.divisionsText),
      };

      const createdProperty = await createAdminProperty(payload);
      setProperties((prev) => [createdProperty, ...prev]);
      setCreateForm(defaultForm);
      setFeedback("O imovel foi criado com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Nao foi possivel criar o imovel.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProperty(propertyId) {
    const confirmed = window.confirm("Confirma a eliminacao definitiva deste imovel?");
    if (!confirmed) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      setDeletingId(propertyId);
      await deleteAdminProperty(propertyId);
      setProperties((prev) => prev.filter((property) => property.id !== propertyId));
      setFeedback("O imovel foi eliminado com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Nao foi possivel eliminar o imovel.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCopyPropertyLink(property) {
    try {
      setError("");
      const propertyUrl = buildPropertyPublicUrl(property.id);
      await copyToClipboard(propertyUrl);
      setFeedback(`Link do imovel #${property.id} copiado com sucesso.`);
    } catch (copyError) {
      setError("Nao foi possivel copiar o link do imovel.");
    }
  }

  async function handleCopyShareText(property) {
    try {
      setError("");
      const propertyUrl = buildPropertyPublicUrl(property.id);
      const message = buildShareMessage(property, propertyUrl);
      await copyToClipboard(message);
      setFeedback(`O texto de partilha do imovel #${property.id} foi copiado.`);
    } catch (copyError) {
      setError("Nao foi possivel copiar o texto de partilha.");
    }
  }

  return (
    <section className="card">
      <h1>Gestao de Imoveis (Admin)</h1>
      <p>Operacoes de criacao, consulta, atualizacao e eliminacao com upload de imagens processadas por Sharp no backend.</p>

      <form className="form" onSubmit={handleCreateProperty}>
        <h2>Criar novo imovel</h2>

        <label htmlFor="title">Titulo</label>
        <input
          id="title"
          value={createForm.title}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
        />

        <label htmlFor="description">Descricao</label>
        <input
          id="description"
          value={createForm.description}
          onChange={(event) =>
            setCreateForm((prev) => ({ ...prev, description: event.target.value }))
          }
        />

        <div className="grid-2">
          <div>
            <label htmlFor="objective">Objetivo</label>
            <select
              id="objective"
              value={createForm.objective}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, objective: event.target.value }))
              }
            >
              <option value="comprar">Comprar</option>
              <option value="arrendar">Arrendar</option>
            </select>
          </div>

          <div>
            <label htmlFor="propertyType">Tipo</label>
            <select
              id="propertyType"
              value={createForm.propertyType}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, propertyType: event.target.value }))
              }
            >
              <option value="apartamento">Apartamento</option>
              <option value="moradia">Moradia</option>
              <option value="terreno">Terreno</option>
              <option value="loja">Loja</option>
              <option value="garagem">Garagem</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              value={createForm.status}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="novo">Novo</option>
              <option value="usado">Usado</option>
              <option value="em_construcao">Em construcao</option>
              <option value="para_recuperar">Para recuperar</option>
            </select>
          </div>

          <div>
            <label htmlFor="energyCert">Certificado energetico</label>
            <select
              id="energyCert"
              value={createForm.energyCert}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, energyCert: event.target.value }))
              }
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="Isento">Isento</option>
            </select>
          </div>
        </div>

        <div className="grid-3">
          <div>
            <label htmlFor="price">Preço</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={createForm.price}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, price: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="rooms">Quartos</label>
            <input
              id="rooms"
              type="number"
              value={createForm.rooms}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, rooms: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="bathrooms">Casas de banho</label>
            <input
              id="bathrooms"
              type="number"
              value={createForm.bathrooms}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, bathrooms: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid-3">
          <div>
            <label htmlFor="usefulArea">Area util</label>
            <input
              id="usefulArea"
              type="number"
              step="0.01"
              value={createForm.usefulArea}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, usefulArea: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="grossArea">Area bruta</label>
            <input
              id="grossArea"
              type="number"
              step="0.01"
              value={createForm.grossArea}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, grossArea: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="privativeGrossArea">Area bruta privativa</label>
            <input
              id="privativeGrossArea"
              type="number"
              step="0.01"
              value={createForm.privativeGrossArea}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, privativeGrossArea: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid-3">
          <div>
            <label htmlFor="district">Distrito</label>
            <input
              id="district"
              value={createForm.district}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, district: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="county">Concelho</label>
            <input
              id="county"
              value={createForm.county}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, county: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="parish">Freguesia</label>
            <input
              id="parish"
              value={createForm.parish}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, parish: event.target.value }))}
            />
          </div>
        </div>

        <label htmlFor="addressMap">Morada / Coordenadas</label>
        <input
          id="addressMap"
          value={createForm.addressMap}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, addressMap: event.target.value }))}
        />

        <div className="grid-3">
          <div>
            <label htmlFor="parkingSpaces">Lugares de estacionamento</label>
            <input
              id="parkingSpaces"
              type="number"
              value={createForm.parkingSpaces}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, parkingSpaces: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="ownerId">Proprietario (cliente)</label>
            <select
              id="ownerId"
              value={createForm.ownerId}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, ownerId: event.target.value }))
              }
            >
              <option value="">Sem proprietario associado</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {formatUserOption(client)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="agentId">Agente (admin)</label>
            <select
              id="agentId"
              value={createForm.agentId}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, agentId: event.target.value }))
              }
            >
              <option value="">Administrador da sessao (automatico)</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {formatUserOption(admin)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={createForm.elevator}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, elevator: event.target.checked }))
              }
            />
            Com elevador
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={createForm.evCharging}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, evCharging: event.target.checked }))
              }
            />
            Carregamento eletrico
          </label>
        </div>

        <label htmlFor="divisionsText">Divisoes (uma por linha: Nome:Area)</label>
        <textarea
          id="divisionsText"
          rows={4}
          value={createForm.divisionsText}
          onChange={(event) =>
            setCreateForm((prev) => ({ ...prev, divisionsText: event.target.value }))
          }
        />

        <label htmlFor="images">Imagens</label>
        <input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={(event) =>
            setCreateForm((prev) => ({ ...prev, images: Array.from(event.target.files || []) }))
          }
        />

        <button className="btn" type="submit" disabled={creating}>
          {creating ? "A criar..." : "Criar imovel"}
        </button>
      </form>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}

      <h2>Lista de imoveis</h2>
      {loading ? (
        <p>A carregar dados...</p>
      ) : properties.length === 0 ? (
        <p>Nao existem imoveis registados.</p>
      ) : (
        <div className="property-list">
          {properties.map((property) => (
            <article key={property.id} className="property-item">
              {(() => {
                const propertyUrl = buildPropertyPublicUrl(property.id);
                const facebookShareUrl = buildFacebookShareUrl(propertyUrl);
                const facebookGroupsUrl = buildFacebookGroupsUrl(propertyUrl);

                return (
                  <>
              <h3>
                #{property.id} - {property.title}
              </h3>
              <p>
                {property.propertyType} | {property.objective} | {property.status}
              </p>
              <p>
                Preco: <strong>{property.price} EUR</strong>
              </p>
              <p>
                Local: {property.district} / {property.county} / {property.parish}
              </p>
              <p>
                Agente: {property.agent?.email || "-"} | Proprietario: {property.owner?.email || "-"}
              </p>
              <p>
                Imagens: {property.images?.length || 0} | Divisoes: {property.divisions?.length || 0}
              </p>
              <div className="actions">
                <Link className="btn btn-secondary" to={`/admin/imoveis/${property.id}/editar`}>
                  Edicao completa
                </Link>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteProperty(property.id)}
                  disabled={deletingId === property.id}
                >
                  {deletingId === property.id ? "A eliminar..." : "Eliminar"}
                </button>
              </div>

              <div className="share-block">
                <p>
                  <strong>Partilha de anuncio</strong>
                </p>
                <div className="actions share-actions">
                  <a className="btn btn-secondary" href={facebookShareUrl} target="_blank" rel="noreferrer">
                    Facebook
                  </a>
                  <a className="btn btn-secondary" href={facebookGroupsUrl} target="_blank" rel="noreferrer">
                    Grupos Facebook
                  </a>
                  <a className="btn btn-secondary" href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                    Abrir Instagram
                  </a>
                  <button className="btn btn-secondary" type="button" onClick={() => handleCopyShareText(property)}>
                    Copiar texto de partilha
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => handleCopyPropertyLink(property)}>
                    Copiar link
                  </button>
                </div>
              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminPropertiesPage;
