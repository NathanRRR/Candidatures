import { notFound } from "next/navigation";
import { getApplication } from "@/actions/applications";
import { ApplicationDetailTabs } from "@/components/ApplicationDetailTabs";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const application = await getApplication(params.id);
  if (!application) notFound();

  return (
    <main>
      <h1>
        {application.entreprise} — {application.poste}
      </h1>
      <p>Statut : {application.statut}</p>
      <ApplicationDetailTabs application={application} />
    </main>
  );
}
