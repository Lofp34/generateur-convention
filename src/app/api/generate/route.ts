import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { generateConventionPdf } from "@/lib/convention";
import { formatDateIso } from "@/lib/format";
import { parseParticipants } from "@/lib/participants";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type GeneratePayload = {
  companyName: string;
  companyAddress: string;
  representativeFirstName: string;
  representativeLastName: string;
  representativeRole: string;
  trainingName: string;
  duration: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  instructor: string;
  participants: string;
  amountHt: number;
  conventionDate: string;
};

function required(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Champ requis: ${label}`);
  }
  return value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GeneratePayload;

    const companyName = required(body.companyName, "Entreprise cliente");
    const companyAddress = required(body.companyAddress, "Adresse");
    const representativeFirstName = required(
      body.representativeFirstName,
      "Prenom du representant"
    );
    const representativeLastName = required(
      body.representativeLastName,
      "Nom du representant"
    );
    const representativeRole = required(
      body.representativeRole,
      "Qualite du representant"
    );
    const trainingName = required(body.trainingName, "Nom de la formation");
    const duration = required(body.duration, "Duree");
    const dateStart = required(body.dateStart, "Date de debut");
    const dateEnd = required(body.dateEnd, "Date de fin");
    const location = required(body.location, "Lieu");
    const instructor = required(body.instructor, "Intervenant");
    const participants = required(body.participants, "Participants");
    const conventionDate = required(body.conventionDate, "Date");

    const amountHt = Number(
      String(body.amountHt).replace(",", ".").replace(/\s+/g, "")
    );
    if (Number.isNaN(amountHt) || amountHt <= 0) {
      return new Response(
        JSON.stringify({ error: "Montant HT invalide." }),
        { status: 400 }
      );
    }

    const amountTva = Number((amountHt * 0.2).toFixed(2));
    const amountTtc = Number((amountHt + amountTva).toFixed(2));

    const representativeName = `${representativeFirstName} ${representativeLastName}`.trim();

    const participantsClean = participants.replace(/\s+/g, " ").trim();
    const parsedParticipants = parseParticipants(participantsClean).filter(
      (entry) => entry.fullName.length > 0
    );

    const company = await prisma.company.upsert({
      where: {
        name_address: {
          name: companyName,
          address: companyAddress,
        },
      },
      create: {
        name: companyName,
        address: companyAddress,
      },
      update: {
        name: companyName,
        address: companyAddress,
      },
    });

    await prisma.representative.upsert({
      where: { companyId: company.id },
      create: {
        companyId: company.id,
        firstName: representativeFirstName,
        lastName: representativeLastName,
        role: representativeRole,
      },
      update: {
        firstName: representativeFirstName,
        lastName: representativeLastName,
        role: representativeRole,
      },
    });

    for (const participant of parsedParticipants) {
      await prisma.participant.upsert({
        where: {
          companyId_firstName_lastName: {
            companyId: company.id,
            firstName: participant.firstName,
            lastName: participant.lastName,
          },
        },
        create: {
          companyId: company.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
        },
        update: {},
      });
    }

    await prisma.convention.create({
      data: {
        companyId: company.id,
        trainingName,
        duration,
        dateStart: new Date(`${dateStart}T00:00:00`),
        dateEnd: new Date(`${dateEnd}T00:00:00`),
        dateRange: `${formatDateIso(dateStart)} au ${formatDateIso(dateEnd)}`,
        location,
        instructor,
        amountHt: new Prisma.Decimal(amountHt.toFixed(2)),
        amountTva: new Prisma.Decimal(amountTva.toFixed(2)),
        amountTtc: new Prisma.Decimal(amountTtc.toFixed(2)),
        participantsRaw: participantsClean,
      },
    });

    const pdfBytes = await generateConventionPdf({
      companyName,
      companyAddress,
      representativeName,
      representativeRole,
      trainingName,
      duration,
      dateStart,
      dateEnd,
      location,
      instructor,
      participants: participantsClean,
      amountHt,
      amountTva,
      amountTtc,
      conventionDate,
    });

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"convention-${companyName
          .toLowerCase()
          .replace(/\\s+/g, "-")}.pdf\"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inattendue.";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
