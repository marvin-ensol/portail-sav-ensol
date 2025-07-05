interface TicketStatusBadgeProps {
  status: string;
  pipelineStage?: string;
  lastModified?: string | null;
}

const TicketStatusBadge = ({ status, pipelineStage, lastModified }: TicketStatusBadgeProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      '1': { label: 'Nous allons bientôt traiter votre demande', color: 'bg-yellow-100 text-yellow-700' },
      '2': { label: 'Nous vous demandons plus d\'informations', color: 'bg-gray-100 text-gray-700' },
      '573356530': { label: 'En cours de traitement', color: 'bg-blue-100 text-blue-700' },
      '573359340': { label: 'Intervention planifiée', color: 'bg-orange-100 text-orange-700' },
      '573356532': { label: 'Intervention effectuée', color: 'bg-purple-100 text-purple-700' },
      '4': { label: 'Résolu', color: 'bg-green-100 text-green-700' }
    };
    return statusMap[status] || { label: 'Statut inconnu', color: 'bg-gray-100 text-gray-700' };
  };

  const formatClosedDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return `Résolu le ${date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      })}`;
    } catch {
      return null;
    }
  };

  const statusBadge = getStatusBadge(pipelineStage || status);
  const isResolved = pipelineStage === "4" || status === "4";
  const statusLabel = isResolved && lastModified 
    ? `Résolu le ${formatClosedDate(lastModified)?.replace('Résolu le ', '')}`
    : statusBadge.label;

  return (
    <div className="flex justify-center mt-4">
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
        {isResolved && <span className="mr-1">✓</span>}
        {statusLabel}
      </span>
    </div>
  );
};

export default TicketStatusBadge;