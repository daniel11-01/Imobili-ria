import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAdminProperty,
  deleteAdminProperty,
  listAdminProperties,
} from "../api/adminPropertiesApi";
import { listAdminUsers } from "../api/adminUsersApi";
import { getBackendBaseUrl } from "../utils/backendBaseUrl";

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
const ADMIN_PROPERTIES_PAGE_SIZE = 12;

function formatCurrency(value) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return "Preço sob consulta";
  }

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

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
    `Preço: ${property.price} EUR`,
    `Localização: ${location}`,
    "",
    `Mais informações: ${propertyUrl}`,
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
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: ADMIN_PROPERTIES_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

  const [createForm, setCreateForm] = useState(defaultForm);

  async function loadProperties(page = pagination.page, search = activeSearch) {
    try {
      setLoading(true);
      const response = await listAdminProperties({
        page,
        pageSize: ADMIN_PROPERTIES_PAGE_SIZE,
        search,
      });
      setProperties(response.properties || []);
      setPagination((prev) => ({
        ...prev,
        ...(response.pagination || {}),
      }));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível carregar os imóveis.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsersForSelectors() {
    try {
      const clientUsers = await listAdminUsers({ role: "cliente", all: true });

      setClients(clientUsers.users || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível carregar os utilizadores.");
    }
  }

  useEffect(() => {
    loadUsersForSelectors();
  }, []);

  useEffect(() => {
    loadProperties(pagination.page, activeSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, activeSearch]);

  function formatUserOption(user) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return `${fullName || "Sem nome"} (${user.email})`;
  }

  function applySearch(event) {
    event.preventDefault();
    setError("");
    setFeedback("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setActiveSearch(searchInput.trim());
  }

  function clearSearch() {
    setError("");
    setFeedback("");
    setSearchInput("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setActiveSearch("");
  }

  function goToPage(nextPage) {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) {
      return;
    }

    setPagination((prev) => ({ ...prev, page: nextPage }));
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
      if (createdProperty?.id) {
        if (pagination.page === 1) {
          await loadProperties(1, activeSearch);
        } else {
          setPagination((prev) => ({ ...prev, page: 1 }));
        }
      }
      setCreateForm(defaultForm);
      setFeedback("O imóvel foi criado com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível criar o imóvel.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProperty(propertyId) {
    const confirmed = window.confirm("Confirma a eliminação definitiva deste imóvel?");
    if (!confirmed) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      setDeletingId(propertyId);
      await deleteAdminProperty(propertyId);

      if (properties.length === 1 && pagination.page > 1) {
        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        await loadProperties(pagination.page, activeSearch);
      }

      setFeedback("O imóvel foi eliminado com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível eliminar o imóvel.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCopyPropertyLink(property) {
    try {
      setError("");
      const propertyUrl = buildPropertyPublicUrl(property.id);
      await copyToClipboard(propertyUrl);
      setFeedback(`Link do imóvel #${property.id} copiado com sucesso.`);
    } catch (copyError) {
      setError("Não foi possível copiar o link do imóvel.");
    }
  }

  async function handleCopyShareText(property) {
    try {
      setError("");
      const propertyUrl = buildPropertyPublicUrl(property.id);
      const message = buildShareMessage(property, propertyUrl);
      await copyToClipboard(message);
      setFeedback(`O texto de partilha do imóvel #${property.id} foi copiado.`);
    } catch (copyError) {
      setError("Não foi possível copiar o texto de partilha.");
    }
  }

  return (
    <section className="modern-page admin-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Backoffice</p>
        <h1>Gestão de Imóveis</h1>
        <p>Operações de criação, consulta, atualização e eliminação com upload de imagens processadas por Sharp no backend.</p>
      </header>

      <section className="card">
        <form className="form" onSubmit={handleCreateProperty}>
        <h2>Criar novo imóvel</h2>

        <label htmlFor="title">Título</label>
        <input
          id="title"
          value={createForm.title}
          onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
        />

        <label htmlFor="description">Descrição</label>
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
              <option value="em_construcao">Em construção</option>
              <option value="para_recuperar">Para recuperar</option>
            </select>
          </div>

          <div>
            <label htmlFor="energyCert">Certificado energético</label>
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
            <label htmlFor="usefulArea">Área útil</label>
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
            <label htmlFor="grossArea">Área bruta</label>
            <input
              id="grossArea"
              type="number"
              step="0.01"
              value={createForm.grossArea}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, grossArea: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="privativeGrossArea">Área bruta privativa</label>
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
            <label htmlFor="ownerId">Proprietário (cliente)</label>
            <select
              id="ownerId"
              value={createForm.ownerId}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, ownerId: event.target.value }))
              }
            >
              <option value="">Sem proprietário associado</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {formatUserOption(client)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Agente responsável</label>
            <input value="Administrador da sessão (automático)" disabled readOnly />
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
            Carregamento elétrico
          </label>
        </div>

        <label htmlFor="divisionsText">Divisões (uma por linha: Nome:Área)</label>
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
            {creating ? "A criar..." : "Criar imóvel"}
          </button>
        </form>

        {feedback && <p className="success">{feedback}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2>Lista de imóveis</h2>
        <form className="form" onSubmit={applySearch}>
          <div className="grid-2">
            <div>
              <label htmlFor="propertiesSearch">Pesquisa rápida</label>
              <input
                id="propertiesSearch"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Título, distrito, concelho ou freguesia"
              />
            </div>
            <div className="actions admin-search-actions">
              <button className="btn" type="submit">
                Pesquisar
              </button>
              <button className="btn btn-secondary" type="button" onClick={clearSearch}>
                Limpar
              </button>
            </div>
          </div>
        </form>

        <p>Total: {pagination.total} imóvel(is)</p>
        <p className="helper-text">Só são listados imóveis associados ao teu perfil de administrador.</p>

        {loading ? (
          <p>A carregar dados...</p>
        ) : properties.length === 0 ? (
          <p>Não existem imóveis registados.</p>
        ) : (
          <div className="property-list">
            {properties.map((property) => (
              <article key={property.id} className="property-item">
                {(() => {
                  const propertyUrl = buildPropertyPublicUrl(property.id);
                  const facebookShareUrl = buildFacebookShareUrl(propertyUrl);
                  const facebookGroupsUrl = buildFacebookGroupsUrl(propertyUrl);
                  const mainImage =
                    property.images?.find((image) => image.isMain) ||
                    property.images?.[0] ||
                    null;
                  const imageSrc = mainImage?.imageUrl ? `${backendBaseUrl}${mainImage.imageUrl}` : "";
                  const propertyType = String(property.propertyType || "-").replace("_", " ");
                  const objective = String(property.objective || "-").replace("_", " ");
                  const status = String(property.status || "-").replace("_", " ");

                  return (
                    <>
                      <div className="admin-property-head">
                        <h3>
                          <span className="admin-property-id">#{property.id}</span> {property.title}
                        </h3>
                        <span className="status-badge">{status}</span>
                      </div>

                      <p className="admin-property-meta-line">
                        {propertyType} | {objective}
                      </p>

                      <div className="admin-property-layout">
                        <div>
                          {imageSrc ? (
                            <img className="admin-property-image" src={imageSrc} alt={property.title} loading="lazy" />
                          ) : (
                            <div className="admin-property-image admin-property-image-placeholder">
                              Sem imagem principal
                            </div>
                          )}
                        </div>

                        <div className="admin-property-summary">
                          <p>
                            <strong>{formatCurrency(property.price)}</strong>
                          </p>
                          <p>
                            <span>Localização</span>
                            {" "}
                            {property.district} / {property.county} / {property.parish}
                          </p>
                          <p>
                            <span>Proprietário</span>
                            {" "}
                            {property.owner?.email || "Não associado"}
                          </p>
                          <p>
                            <span>Media</span>
                            {" "}
                            {property.images?.length || 0} imagens | {property.divisions?.length || 0} divisões
                          </p>
                        </div>
                      </div>

                      <div className="actions admin-property-actions">
                        <Link className="btn" to={`/admin/imoveis/${property.id}/editar`}>
                          Editar imóvel
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
                          <strong>Partilha de anúncio</strong>
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

        <div className="pagination">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            Anterior
          </button>

          <span>
            Página {pagination.page} de {pagination.totalPages || 1}
          </span>

          <button
            className="btn btn-secondary"
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Seguinte
          </button>
        </div>
      </section>
    </section>
  );
}

export default AdminPropertiesPage;
