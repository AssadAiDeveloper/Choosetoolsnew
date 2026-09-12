declare module "*.css";
declare module "pdfjs-dist/build/pdf.worker.mjs";
declare module "heic2any" {
  export default function heic2any(options: {
    blob: Blob;
    toType?: string;
    quality?: number;
  }): Promise<Blob | Blob[]>;
}
