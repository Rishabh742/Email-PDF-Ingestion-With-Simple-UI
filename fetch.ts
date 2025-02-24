import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Imap from "imap";
import { simpleParser } from "mailparser";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function GET() {
  const configs = await prisma.emailIngestionConfig.findMany();
  for (const config of configs) {
    const imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port || 993,
      tls: true,
    });

    imap.once("ready", () => {
      imap.openBox("INBOX", false, () => {
        imap.search(["UNSEEN", ["SINCE", new Date()]], (err, results) => {
          if (!results.length) return;

          const fetcher = imap.fetch(results, { bodies: "", struct: true });
          fetcher.on("message", (msg) => {
            msg.on("body", async (stream) => {
              const parsed = await simpleParser(stream);
              parsed.attachments.forEach(async (attachment) => {
                if (attachment.contentType === "application/pdf") {
                  const filePath = path.join(process.cwd(), "pdfs", attachment.filename);
                  fs.writeFileSync(filePath, attachment.content);

                  await prisma.emailAttachment.create({
                    data: {
                      emailConfigId: config.id,
                      fromAddress: parsed.from?.text || "",
                      dateReceived: new Date(parsed.date || ""),
                      subject: parsed.subject || "",
                      attachmentFileName: attachment.filename,
                      filePath,
                    },
                  });
                }
              });
            });
          });

          fetcher.once("end", () => imap.end());
        });
      });
    });

    imap.connect();
  }

  return NextResponse.json({ message: "Emails checked." });
}
