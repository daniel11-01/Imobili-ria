import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAdminPropertyById, updateAdminProperty } from "../api/adminPropertiesApi";
import { listAdminUsers } from "../api/adminUsersApi";
import { getBackendBaseUrl } from "../utils/backendBaseUrl";

const defaultEditForm = {
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
  removeImageIds: [],
  mainImageId: "",
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

function toInputValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function formatUserOption(user) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return `${fullName || "Sem nome"} (${user.email})`;
}

function serializeDivisions(divisions = []) {
  if (!Array.isArray(divisions) || divisions.length === 0) {
    return "";
  }

  return divisions
    .map((division) => `${division.name}${division.area !== null && division.area !== undefined ? `:${division.area}` : ""}`)
    .join("\n");
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

function hydrateForm(property) {
  const mainImage = (property.images || []).find((image) => image.isMain) || null;

  return {
    ...defaultEditForm,
    title: toInputValue(property.title),
    description: toInputValue(property.description),
    objective: toInputValue(property.objective || "comprar"),
    propertyType: toInputValue(property.propertyType || "apartamento"),
    status: toInputValue(property.status || "usado"),
    price: toInputValue(property.price),
    district: toInputValue(property.district),
    county: toInputValue(property.county),
    parish: toInputValue(property.parish),
    addressMap: toInputValue(property.addressMap),
    rooms: toInputValue(property.rooms),
    bathrooms: toInputValue(property.bathrooms),
    usefulArea: toInputValue(property.usefulArea),
    grossArea: toInputValue(property.grossArea),
    privativeGrossArea: toInputValue(property.privativeGrossArea),
    lotArea: toInputValue(property.lotArea),
    buildYear: toInputValue(property.buildYear),
    floor: toInputValue(property.floor),
    elevator: Boolean(property.elevator),
    parkingSpaces: toInputValue(property.parkingSpaces ?? 0),
    evCharging: Boolean(property.evCharging),
    energyCert: toInputValue(property.energyCert || "C"),
    ownerId: toInputValue(property.ownerId),
    agentId: toInputValue(property.agentId),
    divisionsText: serializeDivisions(property.divisions),
    images: [],
    removeImageIds: [],
    mainImageId: mainImage ? String(mainImage.id) : "",
  };
}

function AdminPropertyEditPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(defaultEditForm);
  const [existingImages, setExistingImages] = useState([]);
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [propertyTitle, setPropertyTitle] = useState("");
  const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

  const propertyPublicUrl = useMemo(() => {
    if (!propertyId) {
      return "";
    }
    return buildPropertyPublicUrl(propertyId);
  }, [propertyId]);

  const facebookShareUrl = useMemo(() => {
    if (!propertyPublicUrl) {
      return "#";
    }
    return buildFacebookShareUrl(propertyPublicUrl);
  }, [propertyPublicUrl]);

  const facebookGroupsUrl = useMemo(() => {
    if (!propertyPublicUrl) {
      return "#";
    }
    return buildFacebookGroupsUrl(propertyPublicUrl);
  }, [propertyPublicUrl]);

  const sortedExistingImages = useMemo(() => {
    return [...existingImages].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.id - b.id);
  }, [existingImages]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [property, clientUsers, adminUsers] = await Promise.all([
          getAdminPropertyById(propertyId),
          listAdminUsers({ role: "cliente" }),
          listAdminUsers({ role: "admin" }),
        ]);

        setPropertyTitle(property.title || "");
        setExistingImages(Array.isArray(property.images) ? property.images : []);
        setForm(hydrateForm(property));
        setClients(clientUsers || []);
        setAdmins(adminUsers || []);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Não foi possível carregar o imóvel para edição.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [propertyId]);

  function handleFieldChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleImageRemoval(imageId) {
    setForm((prev) => {
      const exists = prev.removeImageIds.includes(imageId);
      const removeImageIds = exists
        ? prev.removeImageIds.filter((id) => id !== imageId)
        : [...prev.removeImageIds, imageId];

      let mainImageId = prev.mainImageId;
      if (mainImageId && removeImageIds.includes(Number.parseInt(mainImageId, 10))) {
        mainImageId = "";
      }

      return {
        ...prev,
        removeImageIds,
        mainImageId,
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFeedback("");

    try {
      setSaving(true);

      const activeImageIds = sortedExistingImages
        .filter((image) => !form.removeImageIds.includes(image.id))
        .map((image) => image.id);

      const selectedMainImageId = Number.parseInt(form.mainImageId, 10);
      const safeMainImageId =
        Number.isInteger(selectedMainImageId) && activeImageIds.includes(selectedMainImageId)
          ? selectedMainImageId
          : activeImageIds[0];

      const payload = {
        title: form.title,
        description: form.description,
        objective: form.objective,
        propertyType: form.propertyType,
        status: form.status,
        price: form.price,
        district: form.district,
        county: form.county,
        parish: form.parish,
        addressMap: form.addressMap,
        rooms: form.rooms,
        bathrooms: form.bathrooms,
        usefulArea: form.usefulArea,
        grossArea: form.grossArea,
        privativeGrossArea: form.privativeGrossArea,
        lotArea: form.lotArea,
        buildYear: form.buildYear,
        floor: form.floor,
        elevator: form.elevator,
        parkingSpaces: form.parkingSpaces,
        evCharging: form.evCharging,
        energyCert: form.energyCert,
        ownerId: form.ownerId,
        agentId: form.agentId,
        divisions: parseDivisionsText(form.divisionsText),
        removeImageIds: form.removeImageIds,
        images: form.images,
      };

      if (safeMainImageId) {
        payload.mainImageId = safeMainImageId;
      }

      const updatedProperty = await updateAdminProperty(propertyId, payload);
      setPropertyTitle(updatedProperty.title || "");
      setExistingImages(Array.isArray(updatedProperty.images) ? updatedProperty.images : []);
      setForm(hydrateForm(updatedProperty));
      setFeedback("O imóvel foi atualizado com sucesso.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível atualizar o imóvel.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyPropertyLink() {
    try {
      setError("");
      await copyToClipboard(propertyPublicUrl);
      setFeedback(`Link do imóvel #${propertyId} copiado com sucesso.`);
    } catch (copyError) {
      setError("Não foi possível copiar o link do imóvel.");
    }
  }

  async function handleCopyShareText() {
    try {
      setError("");

      const propertyData = {
        title: form.title || propertyTitle || `Imóvel #${propertyId}`,
        objective: form.objective,
        propertyType: form.propertyType,
        status: form.status,
        price: form.price,
        district: form.district,
        county: form.county,
        parish: form.parish,
      };

      const message = buildShareMessage(propertyData, propertyPublicUrl);
      await copyToClipboard(message);
      setFeedback(`O texto de partilha do imóvel #${propertyId} foi copiado.`);
    } catch (copyError) {
      setError("Não foi possível copiar o texto de partilha.");
    }
  }

  if (loading) {
    return (
      <section className="card">
        <p>A carregar imóvel...</p>
      </section>
    );
  }

  return (
    <section className="modern-page admin-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Backoffice</p>
        <h1>Editar imóvel #{propertyId}</h1>
        <p>Edição completa com atualização de dados, imagens e divisões.</p>
        {propertyTitle && <p className="helper-text">Imóvel: {propertyTitle}</p>}
      </header>

      <section className="card">
        <div className="actions">
          <Link className="btn btn-secondary" to="/imoveis">
            Regressar ao catálogo
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
            Regressar
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
            <button className="btn btn-secondary" type="button" onClick={handleCopyShareText}>
              Copiar texto de partilha
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleCopyPropertyLink}>
              Copiar link
            </button>
          </div>
        </div>

        {feedback && <p className="success">{feedback}</p>}
        {error && <p className="error">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="title">Título</label>
        <input id="title" value={form.title} onChange={(event) => handleFieldChange("title", event.target.value)} />

        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(event) => handleFieldChange("description", event.target.value)}
        />

        <div className="grid-2">
          <div>
            <label htmlFor="objective">Objetivo</label>
            <select
              id="objective"
              value={form.objective}
              onChange={(event) => handleFieldChange("objective", event.target.value)}
            >
              <option value="comprar">Comprar</option>
              <option value="arrendar">Arrendar</option>
            </select>
          </div>

          <div>
            <label htmlFor="propertyType">Tipo</label>
            <select
              id="propertyType"
              value={form.propertyType}
              onChange={(event) => handleFieldChange("propertyType", event.target.value)}
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
            <select id="status" value={form.status} onChange={(event) => handleFieldChange("status", event.target.value)}>
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
              value={form.energyCert}
              onChange={(event) => handleFieldChange("energyCert", event.target.value)}
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
            <label htmlFor="price">Preco</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(event) => handleFieldChange("price", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rooms">Quartos</label>
            <input
              id="rooms"
              type="number"
              value={form.rooms}
              onChange={(event) => handleFieldChange("rooms", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bathrooms">Casas de banho</label>
            <input
              id="bathrooms"
              type="number"
              value={form.bathrooms}
              onChange={(event) => handleFieldChange("bathrooms", event.target.value)}
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
              value={form.usefulArea}
              onChange={(event) => handleFieldChange("usefulArea", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="grossArea">Área bruta</label>
            <input
              id="grossArea"
              type="number"
              step="0.01"
              value={form.grossArea}
              onChange={(event) => handleFieldChange("grossArea", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="privativeGrossArea">Área bruta privativa</label>
            <input
              id="privativeGrossArea"
              type="number"
              step="0.01"
              value={form.privativeGrossArea}
              onChange={(event) => handleFieldChange("privativeGrossArea", event.target.value)}
            />
          </div>
        </div>

        <div className="grid-3">
          <div>
            <label htmlFor="lotArea">Área de lote</label>
            <input
              id="lotArea"
              type="number"
              step="0.01"
              value={form.lotArea}
              onChange={(event) => handleFieldChange("lotArea", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="buildYear">Ano de construção</label>
            <input
              id="buildYear"
              type="number"
              value={form.buildYear}
              onChange={(event) => handleFieldChange("buildYear", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="floor">Piso</label>
            <input id="floor" value={form.floor} onChange={(event) => handleFieldChange("floor", event.target.value)} />
          </div>
        </div>

        <div className="grid-3">
          <div>
            <label htmlFor="district">Distrito</label>
            <input
              id="district"
              value={form.district}
              onChange={(event) => handleFieldChange("district", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="county">Concelho</label>
            <input id="county" value={form.county} onChange={(event) => handleFieldChange("county", event.target.value)} />
          </div>
          <div>
            <label htmlFor="parish">Freguesia</label>
            <input id="parish" value={form.parish} onChange={(event) => handleFieldChange("parish", event.target.value)} />
          </div>
        </div>

        <label htmlFor="addressMap">Morada / Coordenadas</label>
        <input
          id="addressMap"
          value={form.addressMap}
          onChange={(event) => handleFieldChange("addressMap", event.target.value)}
        />

        <div className="grid-3">
          <div>
            <label htmlFor="parkingSpaces">Lugares de estacionamento</label>
            <input
              id="parkingSpaces"
              type="number"
              value={form.parkingSpaces}
              onChange={(event) => handleFieldChange("parkingSpaces", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="ownerId">Proprietário (cliente)</label>
            <select id="ownerId" value={form.ownerId} onChange={(event) => handleFieldChange("ownerId", event.target.value)}>
              <option value="">Sem proprietário associado</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {formatUserOption(client)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="agentId">Agente (admin)</label>
            <select id="agentId" value={form.agentId} onChange={(event) => handleFieldChange("agentId", event.target.value)}>
              <option value="">Administrador da sessão (automático)</option>
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
              checked={form.elevator}
              onChange={(event) => handleFieldChange("elevator", event.target.checked)}
            />
            Com elevador
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.evCharging}
              onChange={(event) => handleFieldChange("evCharging", event.target.checked)}
            />
            Carregamento elétrico
          </label>
        </div>

        <label htmlFor="divisionsText">Divisões (uma por linha: Nome:Área)</label>
        <textarea
          id="divisionsText"
          rows={5}
          value={form.divisionsText}
          onChange={(event) => handleFieldChange("divisionsText", event.target.value)}
        />

        <div>
          <h2>Imagens atuais</h2>
          {sortedExistingImages.length === 0 ? (
            <p>Não existem imagens atualmente associadas.</p>
          ) : (
            <div className="property-image-list">
              {sortedExistingImages.map((image) => {
                const markedToRemove = form.removeImageIds.includes(image.id);
                return (
                  <div className="property-image-item" key={image.id}>
                    <img src={`${backendBaseUrl}${image.imageUrl}`} alt={`Imagem ${image.id}`} />
                    <label className="checkbox">
                      <input
                        type="radio"
                        name="mainImageId"
                        value={image.id}
                        checked={String(image.id) === form.mainImageId}
                        disabled={markedToRemove}
                        onChange={(event) => handleFieldChange("mainImageId", event.target.value)}
                      />
                        Imagem principal
                    </label>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={markedToRemove}
                        onChange={() => toggleImageRemoval(image.id)}
                      />
                        Remover imagem
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <label htmlFor="images">Adicionar novas imagens</label>
        <input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => handleFieldChange("images", Array.from(event.target.files || []))}
        />

        {form.images.length > 0 && <p>{form.images.length} nova(s) imagem(ns) selecionada(s).</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "A guardar..." : "Guardar atualizações"}
          </button>
        </form>
      </section>
    </section>
  );
}

export default AdminPropertyEditPage;
