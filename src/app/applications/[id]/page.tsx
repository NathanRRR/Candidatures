import { notFound } from "next/navigation";
import { getApplication } from "@/actions/applications";
import { ApplicationDetailTabs } from "@/components/ApplicationDetailTabs";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const application = await getApplication(params.id);
  if (!application) notFound();

  return (
    <main className="page">
      <div className="detail-header">
        <h1>
          {application.entreprise} — {application.poste}
        </h1>
        <span className={`badge badge-${application.statut}`}>{application.statut}</span>
      </div>
      <ApplicationDetailTabs application={application} />
    </main>
  );
}
