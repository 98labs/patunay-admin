import supabase from '../../../supabase';

export function cleanAndValidateData(rawData: any[]) {
  const cleanedData: any[] = [];
  const skippedRows: { rowIndex: number; reason: string; id_number?: string }[] = [];

  rawData.forEach((item, index) => {
    const cleaned: Record<string, any> = {};

    // Clean keys according to the known headers
    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        const trimmedKey = key.trim();
        cleaned[trimmedKey] = item[key];
      }
    }

    const id_number = cleaned.id_number?.trim() ?? '';
    const title = cleaned.title?.trim() ?? '';
    const description = cleaned.description?.trim() ?? '';
    const height = parseFloat(cleaned.height ?? '0');
    const width = parseFloat(cleaned.width ?? '0');
    const size_unit = cleaned.size_unit?.trim() || 'inches';
    const artist = cleaned.artist?.trim() ?? '';
    const year = parseInt(cleaned.year ?? '0', 10);
    const medium = cleaned.medium?.trim() ?? '';
    const tag_id = null;
    const read_write_count = Number(cleaned.read_write_count ?? 0);
    const provenance = cleaned.provenance?.trim() ?? '';

    const assets = (cleaned.filename || cleaned.url)
      ? [{
          filename: cleaned.filename?.trim() ?? '',
          url: cleaned.url?.trim() ?? ''
        }]
      : [];

    const bibliography = cleaned.bibliography
      ? safeJsonParse(cleaned.bibliography, [])
      : [];
    const collectors = cleaned.collectors
      ? safeJsonParse(cleaned.collectors, [])
      : [];

    const errors = [];

    if (!id_number) errors.push('Missing ID Number');
    if (!title) errors.push('Missing Title');
    if (!description) errors.push('Missing Description');
    if (!artist) errors.push('Missing Artist');
    if (!medium) errors.push('Missing Medium');
    if (height <= 0) errors.push('Invalid Height');
    if (width <= 0) errors.push('Invalid Width');
    if (isNaN(year) || year < 0) errors.push('Invalid Year');
    if (assets.length > 0 && assets.some((asset: any) => !asset.filename || !asset.url)) {
      errors.push('Asset missing filename or URL');
    }

    if (errors.length > 0) {
      skippedRows.push({
        rowIndex: index + 1,
        reason: errors.join(', '),
        id_number: id_number
      });
      return;
    }

    cleanedData.push({
      id_number,
      title,
      description,
      height,
      width,
      size_unit,
      artist,
      year,
      medium,
      tag_id,
      read_write_count,
      provenance,
      assets,
      bibliography,
      collectors
    });
  });

  if (skippedRows.length > 0) {
    console.warn(`Skipped ${skippedRows.length} invalid rows:`, skippedRows);
  }

  return cleanedData;
}

export function safeJsonParse(text: string | any[], fallback: any[] = []) {
  if (!text) return fallback;
  
  // If it's already an array, return it
  if (Array.isArray(text)) return text;

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    if (typeof text === 'string') {
      return text.split(',').map(item => item.trim()).filter(Boolean);
    }
    return fallback;
  }
}

export const uploadInBatches = async (data: any[], batchSize = 50) => {
  const failedBatches: number[] = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const preparedBatch = batch.map((item) => ({
      ...item,
      bibliography: JSON.stringify(item.bibliography ?? []),
      collectors: JSON.stringify(item.collectors ?? []),
    }));

    const { error } = await supabase.rpc("bulk_add_artwork", {
      artworks: preparedBatch,
    });

    if (error) {
      console.error(`Batch ${i / batchSize + 1} failed on attempt:`, error.message);
      failedBatches.push(i / batchSize + 1);
    }
  }

  if (failedBatches.length > 0) {
    console.error("❌ Upload completed with failures in batches:", failedBatches);
    throw new Error(`Upload completed with errors in batches: ${failedBatches.join(", ")}`);
  }

  console.log("✅ Upload completed successfully!");
};