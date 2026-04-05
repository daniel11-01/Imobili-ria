import { useEffect, useMemo, useState } from "react";
import { listAdminMessages, updateAdminMessageReadStatus } from "../api/adminMessagesApi";
import { listAdminProperties } from "../api/adminPropertiesApi";
import { useAuth } from "../context/AuthContext";

const DEFAULT_FILTERS = {
  propertyId: "",
  isRead: "",
  dateFrom: "",
  dateTo: "",
};

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("pt-PT");
}

function formatPropertyLabel(property) {
  return `#${property.id} - ${property.title}`;
}

function formatSenderName(message) {
  const sender = message.sender;

  if (sender) {
    const fullName = [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim();
    if (fullName) {
      return fullName;
    }
  }

  return message.senderName || "Sem nome";
}

function AdminMessagesPage() {
  const { user } = useAuth();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);
  const [properties, setProperties] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [updatingMessageId, setUpdatingMessageId] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const availableProperties = useMemo(() => {
    if (!user?.id) {
      return [];
    }

    return properties.filter((property) => property.agentId === user.id);
  }, [properties, user?.id]);

  useEffect(() => {
    async function loadProperties() {
      try {
        const response = await listAdminProperties();
        setProperties(response || []);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Não foi possível carregar os imóveis para filtro.");
      }
    }

    loadProperties();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        setError("");

        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize,
        };

        if (activeFilters.propertyId) {
          params.propertyId = activeFilters.propertyId;
        }

        if (activeFilters.isRead) {
          params.isRead = activeFilters.isRead;
        }

        if (activeFilters.dateFrom) {
          params.dateFrom = activeFilters.dateFrom;
        }

        if (activeFilters.dateTo) {
          params.dateTo = activeFilters.dateTo;
        }

        const response = await listAdminMessages(params);

        setMessages(response.messages || []);
        setPagination((prev) => ({
          ...prev,
          ...(response.pagination || {}),
        }));
      } catch (requestError) {
        setError(requestError?.response?.data?.message || "Não foi possível carregar as mensagens.");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [activeFilters, pagination.page, pagination.pageSize]);

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setFeedback("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setActiveFilters({ ...filters });
  }

  function clearFilters() {
    setFeedback("");
    setFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }

  async function toggleReadStatus(message) {
    try {
      setError("");
      setFeedback("");
      setUpdatingMessageId(message.id);

      const nextReadStatus = !message.isRead;
      await updateAdminMessageReadStatus(message.id, nextReadStatus);

      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id
            ? {
                ...item,
                isRead: nextReadStatus,
              }
            : item
        )
      );

      setFeedback(nextReadStatus ? "A mensagem foi marcada como lida." : "A mensagem foi marcada como não lida.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível atualizar o estado da mensagem.");
    } finally {
      setUpdatingMessageId(null);
    }
  }

  function goToPage(nextPage) {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) {
      return;
    }

    setPagination((prev) => ({ ...prev, page: nextPage }));
  }

  return (
    <section className="modern-page admin-page">
      <header className="card page-hero">
        <p className="page-hero-badge">Backoffice</p>
        <h1>Gestão de Mensagens</h1>
        <p>Mensagens recebidas de imóveis associados ao utilizador administrador autenticado.</p>
      </header>

      <section className="card">
        <form className="form" onSubmit={applyFilters}>
          <h2>Filtros</h2>

          <div className="grid-3">
            <div>
              <label htmlFor="propertyId">Imóvel</label>
              <select
                id="propertyId"
                value={filters.propertyId}
                onChange={(event) => updateFilter("propertyId", event.target.value)}
              >
                <option value="">Todos</option>
                {availableProperties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {formatPropertyLabel(property)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="isRead">Estado</label>
              <select id="isRead" value={filters.isRead} onChange={(event) => updateFilter("isRead", event.target.value)}>
                <option value="">Todos</option>
                <option value="false">Não lidas</option>
                <option value="true">Lidas</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label htmlFor="dateFrom">Data início</label>
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="dateTo">Data fim</label>
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
              />
            </div>
          </div>

          <div className="actions">
            <button className="btn" type="submit">
              Aplicar filtros
            </button>
            <button className="btn btn-secondary" type="button" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        </form>

        {feedback && <p className="success">{feedback}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2>Caixa de entrada</h2>
        <p>Total: {pagination.total} mensagem(ns) registada(s)</p>

        {loading ? (
          <p>A carregar mensagens...</p>
        ) : messages.length === 0 ? (
          <p>Não existem mensagens para os filtros selecionados.</p>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.isRead ? "message-item property-item" : "message-item property-item unread"}
              >
                <div className="message-header">
                  <h3>
                    #{message.id} - {message.property?.title || "Imóvel removido"}
                  </h3>
                  <span className={message.isRead ? "status-badge" : "status-badge unread"}>
                    {message.isRead ? "Lida" : "Não lida"}
                  </span>
                </div>

                <p>
                  <strong>Data:</strong> {formatDateTime(message.createdAt)}
                </p>
                <p>
                  <strong>Remetente:</strong> {formatSenderName(message)}
                </p>
                <p>
                  <strong>Email:</strong> {message.senderEmail}
                </p>
                <p>
                  <strong>Telefone:</strong> {message.senderPhone || "-"}
                </p>
                <p>
                  <strong>Imóvel:</strong> #{message.property?.id || "-"} | {message.property?.objective || "-"} | {message.property?.propertyType || "-"}
                </p>

                <div className="message-body">
                  <strong>Mensagem</strong>
                  <p>{message.messageText}</p>
                </div>

                <div className="actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => toggleReadStatus(message)}
                    disabled={updatingMessageId === message.id}
                  >
                    {updatingMessageId === message.id
                      ? "A atualizar..."
                      : message.isRead
                        ? "Definir como não lida"
                        : "Definir como lida"}
                  </button>
                </div>
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
            Página {pagination.page} de {pagination.totalPages}
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

export default AdminMessagesPage;
