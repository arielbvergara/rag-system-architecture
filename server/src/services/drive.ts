import { google, drive_v3 } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { Readable } from "stream";
import { DriveFile } from "../types";

export class DriveService {
  private drive: drive_v3.Drive;

  constructor(auth: GoogleAuth) {
    this.drive = google.drive({ version: "v3", auth });
  }

  async listFiles(pageSize = 20, query?: string): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      pageSize,
      fields: "files(id, name, mimeType, size, modifiedTime)",
      q: query,
      orderBy: "modifiedTime desc",
    });

    return (response.data.files || []) as DriveFile[];
  }

  async downloadFile(fileId: string): Promise<{
    data: Readable;
    mimeType: string;
    fileName: string;
  }> {
    const meta = await this.drive.files.get({
      fileId,
      fields: "name, mimeType",
    });

    const response = await this.drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    return {
      data: response.data as Readable,
      mimeType: meta.data.mimeType || "application/octet-stream",
      fileName: meta.data.name || "download",
    };
  }
}
