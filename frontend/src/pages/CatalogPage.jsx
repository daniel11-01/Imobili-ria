import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPublicProperties } from "../api/publicPropertiesApi";
import { useAuth } from "../context/AuthContext";
import { getBackendBaseUrl } from "../utils/backendBaseUrl";

const ROOM_OPTIONS = [0, 1, 2, 3, 4, 5];
const COMPARE_STORAGE_KEY = "ep_compare_properties_v1";
const MAX_COMPARE_ITEMS = 3;

function formatCurrency(value) {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return `${value} EUR`;
  }

  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatArea(value) {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return "-";
  }

  return `${new Intl.NumberFormat("pt-PT").format(numeric)} m2`;
}

function toCompareItem(property) {
  return {
    id: property.id,
    title: property.title,
    price: property.price,
    objective: property.objective,
    propertyType: property.propertyType,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    usefulArea: property.usefulArea,
    district: property.district,
    county: property.county,
    energyCert: property.energyCert,
  };
}

function parseRoomsFromParams(searchParams) {
  return searchParams
    .get("rooms")
    ?.split(",")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value)) || [];
}

function CatalogPage({ embedded = false }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, pageSize: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [compareItems, setCompareItems] = useState([]);
  const [compareHint, setCompareHint] = useState("");

  const [filters, setFilters] = useState({
    objective: searchParams.get("objective") || "",
    propertyType: searchParams.get("propertyType") || "",
    location: searchParams.get("location") || "",
    district: searchParams.get("district") || "",
    county: searchParams.get("county") || "",
    parish: searchParams.get("parish") || "",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    rooms: parseRoomsFromParams(searchParams),
    bathroomsMin: searchParams.get("bathroomsMin") || "",
    status: searchParams.get("status") || "",
    usefulAreaMin: searchParams.get("usefulAreaMin") || "",
    usefulAreaMax: searchParams.get("usefulAreaMax") || "",
    elevator: searchParams.get("elevator") || "",
    hasParking: searchParams.get("hasParking") || "",
    evCharging: searchParams.get("evCharging") || "",
    energyCert: searchParams.get("energyCert") || "",
    sortBy: searchParams.get("sortBy") || "recent",
  });

  const currentPage = useMemo(() => {
    const parsed = Number.parseInt(searchParams.get("page") || "1", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);

  const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCompareItems(parsed.slice(0, MAX_COMPARE_ITEMS));
      }
    } catch {
      setCompareItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareItems));
  }, [compareItems]);

  useEffect(() => {
    if (!properties.length) {
      return;
    }

    setCompareItems((prev) =>
      prev.map((item) => {
        const updated = properties.find((property) => property.id === item.id);
        return updated ? toCompareItem(updated) : item;
      })
    );
  }, [properties]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        setError("");

        const params = Object.fromEntries(searchParams.entries());
        const response = await listPublicProperties(params);

        setProperties(response.properties || []);
        setPagination(response.pagination || { page: 1, totalPages: 1, total: 0, pageSize: 12 });
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Não foi possível carregar o catálogo.");
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [searchParams]);

  function updateFilter(name, value) {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function toggleRoom(roomValue) {
    setFilters((prev) => {
      const exists = prev.rooms.includes(roomValue);
      const nextRooms = exists
        ? prev.rooms.filter((item) => item !== roomValue)
        : [...prev.rooms, roomValue].sort((a, b) => a - b);
      return { ...prev, rooms: nextRooms };
    });
  }

  function applyFilters(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    const entries = {
      objective: filters.objective,
      propertyType: filters.propertyType,
      location: filters.location,
      district: filters.district,
      county: filters.county,
      parish: filters.parish,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      bathroomsMin: filters.bathroomsMin,
      status: filters.status,
      usefulAreaMin: filters.usefulAreaMin,
      usefulAreaMax: filters.usefulAreaMax,
      elevator: filters.elevator,
      hasParking: filters.hasParking,
      evCharging: filters.evCharging,
      energyCert: filters.energyCert,
      sortBy: filters.sortBy,
    };

    Object.entries(entries).forEach(([key, value]) => {
      if (value !== "") {
        params.set(key, value);
      }
    });

    if (filters.rooms.length > 0) {
      params.set("rooms", filters.rooms.join(","));
    }

    params.set("page", "1");
    setSearchParams(params);
  }

  function clearFilters() {
    const reset = {
      objective: "",
      propertyType: "",
      location: "",
      district: "",
      county: "",
      parish: "",
      priceMin: "",
      priceMax: "",
      rooms: [],
      bathroomsMin: "",
      status: "",
      usefulAreaMin: "",
      usefulAreaMax: "",
      elevator: "",
      hasParking: "",
      evCharging: "",
      energyCert: "",
      sortBy: "recent",
    };

    setFilters(reset);
    setSearchParams(new URLSearchParams({ page: "1", sortBy: "recent" }));
  }

  function changePage(nextPage) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    setSearchParams(params);
  }

  function toggleCompare(property) {
    setCompareHint("");

    const compareCandidate = toCompareItem(property);
    const alreadyAdded = compareItems.some((item) => item.id === compareCandidate.id);

    if (alreadyAdded) {
      setCompareItems((prev) => prev.filter((item) => item.id !== compareCandidate.id));
      return;
    }

    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      setCompareHint(`É possível comparar até ${MAX_COMPARE_ITEMS} imóveis em simultâneo.`);
      return;
    }

    setCompareItems((prev) => [...prev, compareCandidate]);
  }

  function removeCompareItem(propertyId) {
    setCompareItems((prev) => prev.filter((item) => item.id !== propertyId));
  }

  function clearCompare() {
    setCompareItems([]);
    setCompareHint("");
  }

  return (
    <section className={embedded ? "catalog-page modern-page embedded-catalog" : "catalog-page modern-page"}>
      {!embedded && (
        <header className="card page-hero catalog-hero">
          <p className="page-hero-badge">Pesquisa Inteligente</p>
          <h1>Catálogo de Imóveis</h1>
          <p>
            A consulta foi redesenhada para uma experiência rápida e clara, com filtros avançados,
            comparação dinâmica e acesso imediato ao detalhe de cada imóvel.
          </p>
        </header>
      )}

      <div className="catalog-layout">
        <aside className="card catalog-intro-card catalog-filter-card">
          {embedded ? <h2>Filtrar catálogo</h2> : <h2>Critérios de pesquisa</h2>}
          <p>
            Ajuste os filtros para obter resultados mais relevantes para o perfil de investimento
            ou habitação pretendido.
          </p>

          <form className="form" onSubmit={applyFilters}>
            <div className="grid-3">
              <div>
                <label htmlFor="objective">Objetivo</label>
                <select
                  id="objective"
                  value={filters.objective}
                  onChange={(event) => updateFilter("objective", event.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="comprar">Comprar</option>
                  <option value="arrendar">Arrendar</option>
                </select>
              </div>

              <div>
                <label htmlFor="propertyType">Tipo de imóvel</label>
                <select
                  id="propertyType"
                  value={filters.propertyType}
                  onChange={(event) => updateFilter("propertyType", event.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="moradia">Moradia</option>
                  <option value="terreno">Terreno</option>
                  <option value="loja">Loja</option>
                  <option value="garagem">Garagem</option>
                </select>
              </div>

              <div>
                <label htmlFor="sortBy">Ordenação</label>
                <select
                  id="sortBy"
                  value={filters.sortBy}
                  onChange={(event) => updateFilter("sortBy", event.target.value)}
                >
                  <option value="recent">Mais recentes</option>
                  <option value="price_asc">Preço: menor para maior</option>
                  <option value="price_desc">Preço: maior para menor</option>
                  <option value="area_desc">Área: maior para menor</option>
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div>
                <label htmlFor="location">Localização (pesquisa livre)</label>
                <input
                  id="location"
                  value={filters.location}
                  onChange={(event) => updateFilter("location", event.target.value)}
                  placeholder="Ex: Lisboa ou Oeiras"
                />
              </div>
              <div>
                <label htmlFor="priceMin">Preço mínimo</label>
                <input
                  id="priceMin"
                  type="number"
                  value={filters.priceMin}
                  onChange={(event) => updateFilter("priceMin", event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="priceMax">Preço máximo</label>
                <input
                  id="priceMax"
                  type="number"
                  value={filters.priceMax}
                  onChange={(event) => updateFilter("priceMax", event.target.value)}
                />
              </div>
            </div>

            <div>
              <label>Tipologia (quartos)</label>
              <div className="room-pills">
                {ROOM_OPTIONS.map((roomValue) => {
                  const label = roomValue === 5 ? "T5+" : `T${roomValue}`;
                  const selected = filters.rooms.includes(roomValue);
                  return (
                    <button
                      key={roomValue}
                      type="button"
                      className={selected ? "pill selected" : "pill"}
                      onClick={() => toggleRoom(roomValue)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
            >
              {showAdvancedFilters ? "Ocultar filtros avançados" : "Mais filtros"}
            </button>

            {showAdvancedFilters && (
              <div className="advanced-filters">
                <div className="grid-3">
                  <div>
                    <label htmlFor="bathroomsMin">WCs mínimas</label>
                    <select
                      id="bathroomsMin"
                      value={filters.bathroomsMin}
                      onChange={(event) => updateFilter("bathroomsMin", event.target.value)}
                    >
                      <option value="">Todas</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status">Estado do imóvel</label>
                    <select
                      id="status"
                      value={filters.status}
                      onChange={(event) => updateFilter("status", event.target.value)}
                    >
                      <option value="">Todos</option>
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
                      value={filters.energyCert}
                      onChange={(event) => updateFilter("energyCert", event.target.value)}
                    >
                      <option value="">Todos</option>
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
                    <label htmlFor="usefulAreaMin">Área útil mínima</label>
                    <input
                      id="usefulAreaMin"
                      type="number"
                      value={filters.usefulAreaMin}
                      onChange={(event) => updateFilter("usefulAreaMin", event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="usefulAreaMax">Área útil máxima</label>
                    <input
                      id="usefulAreaMax"
                      type="number"
                      value={filters.usefulAreaMax}
                      onChange={(event) => updateFilter("usefulAreaMax", event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="district">Distrito (específico)</label>
                    <input
                      id="district"
                      value={filters.district}
                      onChange={(event) => updateFilter("district", event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div>
                    <label htmlFor="county">Concelho</label>
                    <input
                      id="county"
                      value={filters.county}
                      onChange={(event) => updateFilter("county", event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="parish">Freguesia</label>
                    <input
                      id="parish"
                      value={filters.parish}
                      onChange={(event) => updateFilter("parish", event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="elevator">Elevador</label>
                    <select
                      id="elevator"
                      value={filters.elevator}
                      onChange={(event) => updateFilter("elevator", event.target.value)}
                    >
                      <option value="">Indiferente</option>
                      <option value="true">Com elevador</option>
                      <option value="false">Sem elevador</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div>
                    <label htmlFor="hasParking">Estacionamento</label>
                    <select
                      id="hasParking"
                      value={filters.hasParking}
                      onChange={(event) => updateFilter("hasParking", event.target.value)}
                    >
                      <option value="">Indiferente</option>
                      <option value="true">Com estacionamento</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="evCharging">Carregamento elétrico</label>
                    <select
                      id="evCharging"
                      value={filters.evCharging}
                      onChange={(event) => updateFilter("evCharging", event.target.value)}
                    >
                      <option value="">Indiferente</option>
                      <option value="true">Com carregamento</option>
                      <option value="false">Sem carregamento</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="actions">
              <button className="btn" type="submit">
                Aplicar filtros
              </button>
              <button className="btn btn-secondary" type="button" onClick={clearFilters}>
                Limpar filtros
              </button>
            </div>
          </form>
        </aside>

        <section className="catalog-results-column">
          <div className="card catalog-results-head">
            <div className="catalog-header">
              <h2>Resultados</h2>
              <div className="catalog-header-meta">
                <p>{loading ? "A carregar..." : `${pagination.total} imóvel(is) encontrado(s)`}</p>
                <span className="compare-counter">
                  Comparação: {compareItems.length}/{MAX_COMPARE_ITEMS}
                </span>
              </div>
            </div>
            {error && <p className="error">{error}</p>}
          </div>

          {compareItems.length > 0 && (
            <section className="card compare-panel">
              <div className="compare-panel-header">
                <h2>Comparar Imóveis</h2>
                <button className="btn btn-secondary" type="button" onClick={clearCompare}>
                  Limpar comparação
                </button>
              </div>

              <div className="compare-table-wrap">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>Característica</th>
                      {compareItems.map((item) => (
                        <th key={item.id}>
                          <div className="compare-title-cell">
                            <span>{item.title}</span>
                            <button
                              className="link-btn"
                              type="button"
                              onClick={() => removeCompareItem(item.id)}
                            >
                              Remover
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Preço</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-price`}>{formatCurrency(item.price)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Objetivo</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-objective`}>{item.objective || "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Tipo</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-type`}>{item.propertyType || "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Tipologia</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-rooms`}>T{item.rooms ?? "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>WCs</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-bath`}>{item.bathrooms ?? "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Área útil</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-area`}>{formatArea(item.usefulArea)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Localização</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-location`}>
                          {item.district || "-"}
                          {item.county ? ` / ${item.county}` : ""}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Energia</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-energy`}>{item.energyCert || "-"}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>Detalhe</td>
                      {compareItems.map((item) => (
                        <td key={`${item.id}-action`}>
                          <Link className="btn btn-secondary" to={`/imoveis/${item.id}`}>
                            Ver imóvel
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {compareHint && <p className="helper-text">{compareHint}</p>}
            </section>
          )}

          {loading ? (
            <div className="card">
              <p>A carregar catálogo...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="card">
              <p>Não existem resultados para os filtros selecionados.</p>
            </div>
          ) : (
            <div className="catalog-grid">
              {properties.map((property) => (
                <article key={property.id} className="catalog-card">
                  {property.mainImage?.imageUrl ? (
                    <img
                      className="catalog-image"
                      src={`${backendBaseUrl}${property.mainImage.imageUrl}`}
                      alt={property.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="catalog-image placeholder">Imagem indisponível</div>
                  )}

                  <div className="catalog-body">
                    <h3>{property.title}</h3>
                    <p>
                      {property.objective} | {property.propertyType} | {property.status}
                    </p>
                    <p>
                      <strong>{formatCurrency(property.price)}</strong>
                    </p>
                    <p>
                      {property.district} / {property.county} / {property.parish}
                    </p>
                    <p>
                      {property.rooms} quartos | {property.bathrooms} WCs | {formatArea(property.usefulArea)}
                    </p>
                    {typeof property.viewsCount === "number" && (
                      <p>Visualizações: {property.viewsCount}</p>
                    )}

                    <div className="catalog-card-actions">
                      <Link className="btn" to={`/imoveis/${property.id}`}>
                        Ver detalhe
                      </Link>
                      <button
                        className={
                          compareItems.some((item) => item.id === property.id)
                            ? "btn btn-secondary btn-compare-active"
                            : "btn btn-secondary"
                        }
                        type="button"
                        onClick={() => toggleCompare(property)}
                      >
                        {compareItems.some((item) => item.id === property.id)
                          ? "Remover comparação"
                          : "Comparar"}
                      </button>
                      {user?.role === "colaborador" && property.canEdit && (
                        <Link className="btn btn-secondary" to={`/admin/imoveis/${property.id}/editar`}>
                          Editar
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="card pagination">
            <button
              className="btn btn-secondary"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => changePage(currentPage - 1)}
            >
              Anterior
            </button>

            <span>
              Página {pagination.page} de {pagination.totalPages}
            </span>

            <button
              className="btn btn-secondary"
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => changePage(currentPage + 1)}
            >
              Seguinte
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

export default CatalogPage;
