import { notFound } from "next/navigation";
import { getApplication } from "@/actions/applications";
import { ApplicationDetailTabs } from "@/components/ApplicationDetailTabs";
import { DeleteApplicationButton } from "@/components/DeleteApplicationButton";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const application = await getApplication(params.id);
  if (!application) notFound();

  return (
    <main className="page">
      <div className="detail-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>
            {application.entreprise} — {application.poste}
          </h1>
          <span className={`badge badge-${application.statut}`}>{application.statut}</span>
        </div>
        <DeleteApplicationButton applicationId={application.id} />
      </div>
      <ApplicationDetailTabs application={application} />
    </main>
  );
}
