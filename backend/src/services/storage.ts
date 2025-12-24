export type StorageSubdir = 'sop01' | 'roadmaps' | 'documents';

export function getStorageProvider(): 'db' | 's3' | 'fs' {
  const p = (process.env.DOC_STORAGE || '').toLowerCase();
  if (p === 's3') return 's3';
  if (p === 'fs') return 'fs';
  return 'db';
}

async function getS3() {
  const { S3Client } = await import('@aws-sdk/client-s3');
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  return new S3Client({ region });
}

export async function s3PutText(params: { tenantId: string; subdir: StorageSubdir; filename: string; content: string; contentType?: string; }): Promise<{ key: string }> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const bucket = process.env.S3_BUCKET as string;
  if (!bucket) throw new Error('S3_BUCKET is required when DOC_STORAGE=s3');
  const key = `${params.subdir}/${params.tenantId}/${params.filename}`;
  const s3 = await getS3();
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: params.content,
    ContentType: params.contentType || 'text/markdown; charset=utf-8',
  }));
  return { key };
}

export async function s3GetSignedUrl(params: { key: string; expiresIn?: number }): Promise<string> {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const bucket = process.env.S3_BUCKET as string;
  if (!bucket) throw new Error('S3_BUCKET is required when DOC_STORAGE=s3');
  const s3 = await getS3();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: params.key });
  return getSignedUrl(s3, cmd, { expiresIn: params.expiresIn ?? 60 });
}
