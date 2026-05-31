export type DeliveryReadyEmailInput = {
  to: string;
  requestTitle: string;
  portalUrl: string;
  filenames: string[];
};

export type DeliveryReadyEmailResult = {
  ok: boolean;
  provider: 'stub';
  messageId?: string;
  subject: string;
  body: string;
};

export async function sendDeliveryReadyEmail(input: DeliveryReadyEmailInput): Promise<DeliveryReadyEmailResult> {
  if (!input.to.trim()) throw new Error('EMAIL_TO_REQUIRED');
  if (!input.requestTitle.trim()) throw new Error('EMAIL_REQUEST_TITLE_REQUIRED');
  if (!input.portalUrl.trim()) throw new Error('EMAIL_PORTAL_URL_REQUIRED');

  const filenames = input.filenames.map((filename) => filename.trim()).filter(Boolean);
  if (filenames.length === 0) throw new Error('EMAIL_FILENAMES_REQUIRED');

  const subject = `Tài liệu final đã sẵn sàng: ${input.requestTitle}`;
  const body = [
    `Yêu cầu: ${input.requestTitle}`,
    'Tài liệu final:',
    ...filenames.map((filename) => `- ${filename}`),
    `Truy cập/tải xuống: ${input.portalUrl}`,
    'Liên kết tải xuống có hiệu lực trong 15 phút.',
  ].join('\n');

  return {
    ok: true,
    provider: 'stub',
    messageId: 'stub-delivery-ready',
    subject,
    body,
  };
}
