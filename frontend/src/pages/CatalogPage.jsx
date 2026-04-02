import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listPublicProperties } from "../api/publicPropertiesApi";
import { useAuth } from "../context/AuthContext";
import { getBackendBaseUrl } from "../utils/backendBaseUrl";

const ROOM_OPTIONS = [0, 1, 2, 3, 4, 5];

function parseRoomsFromParams(searchParams) {
  return searchParams
    .get("rooms")
    ?.split(",")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value)) || [];
}

function CatalogPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, pageSize: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
    async function loadCatalog() {
      try {
        setLoading(true);
        setError("");

        const params = Object.fromEntries(searchParams.entries());
        const response = await listPublicProperties(params);

        setProperties(response.properties || []);
        setPagination(response.pagination || { page: 1, totalPages: 1, total: 0, pageSize: 12 });
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Falha ao carregar catalogo.");
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

  return (
    <section className="catalog-page">
      <div className="card">
        <h1>Catalogo de Imoveis</h1>
        <p>Pesquisa publica com filtros e ordenacao por URL.</p>

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
              <label htmlFor="propertyType">Tipo de imovel</label>
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
              <label htmlFor="sortBy">Ordenacao</label>
              <select
                id="sortBy"
                value={filters.sortBy}
                onChange={(event) => updateFilter("sortBy", event.target.value)}
              >
                <option value="recent">Mais recentes</option>
                <option value="price_asc">Preco: menor para maior</option>
                <option value="price_desc">Preco: maior para menor</option>
                <option value="area_desc">Area: maior para menor</option>
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div>
              <label htmlFor="location">Localizacao (pesquisa livre)</label>
              <input
                id="location"
                value={filters.location}
                onChange={(event) => updateFilter("location", event.target.value)}
                placeholder="Ex: Lisboa ou Oeiras"
              />
            </div>
            <div>
              <label htmlFor="priceMin">Preco minimo</label>
              <input
                id="priceMin"
                type="number"
                value={filters.priceMin}
                onChange={(event) => updateFilter("priceMin", event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="priceMax">Preco maximo</label>
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
            {showAdvancedFilters ? "Ocultar filtros avancados" : "Mais filtros"}
          </button>

          {showAdvancedFilters && (
            <div className="advanced-filters">
              <div className="grid-3">
                <div>
                  <label htmlFor="bathroomsMin">WCs minimas</label>
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
                  <label htmlFor="status">Estado do imovel</label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(event) => updateFilter("status", event.target.value)}
                  >
                    <option value="">Todos</option>
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
                  <label htmlFor="usefulAreaMin">Area util minima</label>
                  <input
                    id="usefulAreaMin"
                    type="number"
                    value={filters.usefulAreaMin}
                    onChange={(event) => updateFilter("usefulAreaMin", event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="usefulAreaMax">Area util maxima</label>
                  <input
                    id="usefulAreaMax"
                    type="number"
                    value={filters.usefulAreaMax}
                    onChange={(event) => updateFilter("usefulAreaMax", event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="district">Distrito (especifico)</label>
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
                  <label htmlFor="evCharging">Carregamento eletrico</label>
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
      </div>

      <div className="catalog-header">
        <h2>Resultados</h2>
        <p>
          {loading ? "A carregar..." : `${pagination.total} imovel(is) encontrado(s)`}
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>A carregar catalogo...</p>
      ) : properties.length === 0 ? (
        <div className="card">
          <p>Sem resultados para os filtros selecionados.</p>
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
                <div className="catalog-image placeholder">Sem imagem</div>
              )}

              <div className="catalog-body">
                <h3>{property.title}</h3>
                <p>
                  {property.objective} | {property.propertyType} | {property.status}
                </p>
                <p>
                  <strong>{property.price} EUR</strong>
                </p>
                <p>
                  {property.district} / {property.county} / {property.parish}
                </p>
                <p>
                  {property.rooms} quartos | {property.bathrooms} WCs | {property.usefulArea} m2
                </p>
                {typeof property.viewsCount === "number" && (
                  <p>Visualizacoes: {property.viewsCount}</p>
                )}

                <div className="catalog-card-actions">
                  <Link className="btn" to={`/imoveis/${property.id}`}>
                    Ver detalhe
                  </Link>
                  {user?.role === "admin" && property.canEdit && (
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

      <div className="pagination">
        <button
          className="btn btn-secondary"
          type="button"
          disabled={currentPage <= 1}
          onClick={() => changePage(currentPage - 1)}
        >
          Anterior
        </button>

        <span>
          Pagina {pagination.page} de {pagination.totalPages}
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
  );
}

export default CatalogPage;
