import { useEffect, useMemo, useState } from "react";
import { createAdminProperty } from "../api/adminPropertiesApi";
import { listAdminUsers } from "../api/adminUsersApi";
import { geocodeAddressQuery } from "../utils/geocoding";
import { useAuth } from "../context/AuthContext";

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
  latitude: "",
  longitude: "",
  showLocation: true,
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

function buildAddressSearchQuery(form) {
  return [form.addressMap, form.parish, form.county, form.district, "Portugal"]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildGoogleMapsPinUrl(latitude, longitude) {
  const lat = Number.parseFloat(latitude);
  const lng = Number.parseFloat(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function AdminPropertiesPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [creating, setCreating] = useState(false);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState(defaultForm);
  const canCreateOrEdit = user?.role === "colaborador" || user?.role === "admin";
  const createMapsUrl = useMemo(
    () => buildGoogleMapsPinUrl(createForm.latitude, createForm.longitude),
    [createForm.latitude, createForm.longitude]
  );

  async function loadUsersForSelectors() {
    try {
      const [clientUsers, adminUsers] = await Promise.all([
        listAdminUsers({ role: "cliente", all: true }),
        listAdminUsers({ role: "admin", all: true }),
      ]);
      setClients(clientUsers.users || []);
      setAdmins(adminUsers.users || []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível carregar os utilizadores.");
    }
  }

  useEffect(() => {
    if (canCreateOrEdit) {
      loadUsersForSelectors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreateOrEdit]);

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

      await createAdminProperty(payload);
      setCreateForm(defaultForm);
      setFeedback("O imóvel foi criado com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível criar o imóvel.");
    } finally {
      setCreating(false);
    }
  }

  async function handleResolveCreateLocation() {
    const addressQuery = buildAddressSearchQuery(createForm);
    if (!addressQuery) {
      setError("Indica a morada do imóvel antes de pesquisar no mapa.");
      return;
    }

    try {
      setError("");
      setFeedback("");
      setResolvingLocation(true);
      const result = await geocodeAddressQuery(addressQuery);
      setCreateForm((prev) => ({
        ...prev,
        addressMap: prev.addressMap || result.displayName,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
      setFeedback("Localização associada com sucesso.");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível obter coordenadas para esta morada.");
    } finally {
      setResolvingLocation(false);
    }
  }

  return (
    <section className="modern-page admin-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Backoffice</p>
        <h1>Gestão de Imóveis</h1>
        <p>Criação centralizada nesta área; edição e eliminação são geridas no detalhe do imóvel.</p>
      </header>

      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}

      {canCreateOrEdit && (
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

        <label htmlFor="addressMap">Morada do imóvel</label>
        <input
          id="addressMap"
          value={createForm.addressMap}
          placeholder="Ex.: Rua de Santa Catarina 320, Porto"
          onChange={(event) => setCreateForm((prev) => ({ ...prev, addressMap: event.target.value }))}
        />
        <p className="helper-text">Recomendado: indicar a morada o mais exata possível para melhor precisão no mapa.</p>

        <div>
          <label htmlFor="showLocation">Localização no detalhe público</label>
          <select
            id="showLocation"
            value={createForm.showLocation ? "true" : "false"}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, showLocation: event.target.value === "true" }))
            }
          >
            <option value="true">Mostrar</option>
            <option value="false">Esconder</option>
          </select>
        </div>

        <div className="actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleResolveCreateLocation}
            disabled={resolvingLocation || creating}
          >
            {resolvingLocation ? "A localizar..." : "Associar localização no mapa"}
          </button>
          {createMapsUrl && (
            <a className="btn btn-secondary" href={createMapsUrl} target="_blank" rel="noreferrer">
              Abrir no Google Maps
            </a>
          )}
        </div>

        <div className="grid-2">
          <div>
            <label htmlFor="latitude">Latitude</label>
            <input id="latitude" value={createForm.latitude} readOnly placeholder="Automático" />
          </div>
          <div>
            <label htmlFor="longitude">Longitude</label>
            <input id="longitude" value={createForm.longitude} readOnly placeholder="Automático" />
          </div>
        </div>

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
            <label htmlFor="agentId">Agente (admin responsável)</label>
            <select
              id="agentId"
              value={createForm.agentId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, agentId: event.target.value }))}
            >
              <option value="">Sem responsável associado</option>
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

      </section>
      )}
    </section>
  );
}

export default AdminPropertiesPage;
