'use client';

import { Tag, Button, Card, Typography, Flex, Steps, Radio, Input, Upload, List, Space, Divider, Alert, Form, message } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { MatterCatalogItem } from '@/lib/intake/catalog';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { UploadProps } from 'antd';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

type UploadedFile = { filename: string; size: number };
type Answer = { key: string; label: string; value: string };

export function IntakeShell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', minHeight: '100vh', background: '#F8FAFC' }}>
      <Flex vertical gap={32}>
        {children}
      </Flex>
    </main>
  );
}

export function IntakeHeader() {
  return (
    <Card size="small" style={{ background: 'transparent', border: 'none', padding: 0 }}>
      <Flex vertical gap={8}>
        <Title level={2} style={{ margin: 0, color: '#0F172A' }}>
          Gửi yêu cầu pháp lý
        </Title>
        <Paragraph style={{ margin: 0, color: '#475569', fontSize: 16 }}>
          Trả lời vài câu hỏi để chuyên viên có đủ thông tin tiếp nhận hồ sơ.
        </Paragraph>
      </Flex>
    </Card>
  );
}

export function ProgressSteps({ activeStep }: { activeStep: number }) {
  const steps = [
    { title: 'Dịch vụ' },
    { title: 'Câu hỏi' },
    { title: 'Tài liệu' },
    { title: 'Kiểm tra' },
  ];

  return (
    <Card style={{ borderRadius: 16 }}>
      <Steps
        current={activeStep}
        size="small"
        items={steps.map((step, index) => ({
          title: step.title,
          status: index < activeStep ? 'finish' : index === activeStep ? 'process' : 'wait',
        }))}
      />
    </Card>
  );
}

export function ServiceSelection({ catalog }: { catalog: readonly MatterCatalogItem[] }) {
  const [selected, setSelected] = useState(catalog[0]?.key || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selected) {
      setError('Vui lòng chọn một nhóm dịch vụ để tiếp tục.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('matterTypeKey', selected);
      const response = await fetch('/api/intake/create-draft', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.requestId) {
        router.push(`/intake?requestId=${result.requestId}&step=1`);
      } else {
        message.error(result.error || 'Có lỗi xảy ra');
      }
    } catch {
      message.error('Có lỗi xảy ra khi tạo hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<Title level={4} style={{ margin: 0 }}>Bạn cần hỗ trợ việc gì?</Title>}>
      <Form.Item style={{ marginBottom: 16 }} validateStatus={error ? 'error' : ''} help={error}>
        <Paragraph type="secondary">Chọn một nhóm dịch vụ để bắt đầu tạo hồ sơ nháp.</Paragraph>
        <Radio.Group value={selected} onChange={(e) => { setSelected(e.target.value); setError(''); }} name="matterTypeKey" style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {catalog.map((item) => {
              const isSelected = selected === item.key;
              return (
                <Card
                  key={item.key}
                  size="small"
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    borderColor: isSelected ? '#0F766E' : '#E2E8F0',
                    background: isSelected ? '#F0FDFA' : '#FFFFFF',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Radio value={item.key} style={{ width: '100%' }}>
                    <Space direction="vertical" size={4}>
                      <Text strong style={{ color: isSelected ? '#0F766E' : '#0F172A' }}>
                        {item.label}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        {item.description}
                      </Text>
                    </Space>
                  </Radio>
                </Card>
              );
            })}
          </Space>
        </Radio.Group>
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" size="large" block onClick={handleSubmit} loading={loading}>
          Tiếp tục
        </Button>
      </Form.Item>
    </Card>
  );
}

type QuestionStepProps = {
  matterType: MatterCatalogItem;
  savedAnswers?: Record<string, string>;
  requestId: string;
};

export function QuestionStep({ matterType, savedAnswers = {}, requestId }: QuestionStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const newErrors: Record<string, string> = {};

    for (const question of matterType.questions) {
      if (question.required) {
        const value = formData.get(`answer.${question.key}`) as string;
        if (!value?.trim()) {
          newErrors[question.key] = `Vui lòng nhập ${question.label}`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Collect answers
      const answers: Record<string, string> = {};
      for (const question of matterType.questions) {
        const value = formData.get(`answer.${question.key}`) as string;
        if (value?.trim()) {
          answers[question.key] = value.trim();
        }
      }

      // Save answers via API
      const saveResponse = await fetch('/api/intake/save-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, answers }),
      });

      const saveResult = await saveResponse.json();

      if (saveResponse.ok) {
        router.push(`/intake?requestId=${requestId}&step=2`);
      } else {
        message.error(saveResult.error || 'Có lỗi khi lưu câu trả lời');
      }
    } catch {
      message.error('Có lỗi xảy ra khi lưu câu trả lời');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={<Space><span>Thông tin cần cung cấp</span><Tag color="blue">{matterType.label}</Tag></Space>}
    >
      {matterType.key === 'unsupported' && (
        <Alert
          message="Hồ sơ sẽ được chuyển để chuyên viên phân loại trước khi xử lý."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <form ref={formRef} onSubmit={handleSubmit}>
        {matterType.questions.map((question) => (
          <Form.Item
            key={question.key}
            label={<Text strong>{question.label}{question.required && <Text type="danger"> *</Text>}</Text>}
            validateStatus={errors[question.key] ? 'error' : ''}
            help={errors[question.key] || ''}
            style={{ marginBottom: 16 }}
          >
            {question.type === 'textarea' ? (
              <TextArea
                rows={4}
                placeholder={`Nhập ${question.label.toLowerCase()}...`}
                name={`answer.${question.key}`}
                defaultValue={savedAnswers[question.key] || ''}
              />
            ) : (
              <Input
                placeholder={`Nhập ${question.label.toLowerCase()}...`}
                size="large"
                name={`answer.${question.key}`}
                defaultValue={savedAnswers[question.key] || ''}
              />
            )}
          </Form.Item>
        ))}
        <Alert
          message="Vui lòng điền thông tin bắt buộc trước khi tiếp tục."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Lưu câu trả lời
        </Button>
      </form>
    </Card>
  );
}

type UploadStepProps = {
  requestId: string;
  files: UploadedFile[];
};

export function UploadStep({ requestId, files: initialFiles }: UploadStepProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const uploadProps: UploadProps = {
    accept: '.pdf,.doc,.docx,.png,.jpg,.jpeg',
    showUploadList: true,
    name: 'file',
    disabled: uploading,
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file as File);
      formData.append('requestId', requestId);
      try {
        const response = await fetch('/api/intake/attach-file', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (response.ok) {
          setFiles((prev) => [...prev, { filename: result.filename, size: result.size }]);
          onSuccess?.(result);
          message.success(`Đã tải lên: ${result.filename}`);
        } else {
          onError?.(new Error(result.error || 'Upload failed'));
          message.error(result.error || 'Có lỗi khi tải tệp');
        }
      } catch (error) {
        onError?.(error as Error);
        message.error('Có lỗi khi tải tệp');
      } finally {
        setUploading(false);
      }
    },
  };

  const handleContinue = () => {
    router.push(`/intake?requestId=${requestId}&step=3`);
  };

  return (
    <Card title={<Title level={4} style={{ margin: 0 }}>Tài liệu hỗ trợ</Title>}>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Tải lên hợp đồng, giấy phép, email trao đổi hoặc tài liệu liên quan. Không cần OCR ở bước này.
      </Paragraph>
      <Dragger {...uploadProps}>
        <p style={{ marginBottom: 8 }}>
          <UploadOutlined style={{ fontSize: 32, color: '#0F766E' }} />
        </p>
        <Text strong style={{ fontSize: 16 }}>Chọn tệp đính kèm</Text>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          hoặc kéo thả tệp vào đây
        </Paragraph>
      </Dragger>
      <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
        Tệp được lưu riêng tư theo hồ sơ và không tạo đường dẫn công khai.
      </Paragraph>
      {files.length > 0 && (
        <>
          <Divider />
          <List
            size="small"
            header={<Text strong>Đã tải lên ({files.length})</Text>}
            dataSource={files}
            renderItem={(file) => (
              <List.Item>
                <Space>
                  <CheckCircleOutlined style={{ color: '#0F766E' }} />
                  <Text>{file.filename}</Text>
                  <Text type="secondary">({formatFileSize(file.size)})</Text>
                </Space>
              </List.Item>
            )}
          />
        </>
      )}
      <Divider />
      <Button type="primary" size="large" block onClick={handleContinue}>
        Tiếp tục
      </Button>
    </Card>
  );
}

type ReviewSummaryProps = {
  matterType: MatterCatalogItem;
  answers: Answer[];
  files: UploadedFile[];
  requestId: string;
};

export function ReviewSummary({ matterType, answers, files, requestId }: ReviewSummaryProps) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        message.success('Yêu cầu đã được gửi thành công!');
        router.push(`/requests/${result.id}`);
      } else {
        message.error(result.error || 'Có lỗi khi gửi yêu cầu');
      }
    } catch {
      message.error('Có lỗi khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Kiểm tra trước khi gửi</Title>}
      extra={<Tag color="blue">{matterType.label}</Tag>}
    >
      <Card size="small" style={{ marginBottom: 16, background: '#F8FAFC' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Loại việc</Text>
        <div><Text strong>{matterType.label}</Text></div>
      </Card>

      {answers.length > 0 && (
        <Card size="small" title="Câu trả lời của bạn" style={{ marginBottom: 16 }}>
          {answers.map((answer, index) => (
            <div key={answer.key} style={{ marginBottom: index < answers.length - 1 ? 12 : 0 }}>
              <Text type="secondary">{answer.label}</Text>
              <div><Text>{answer.value || <Text type="secondary">Chưa trả lời</Text>}</Text></div>
            </div>
          ))}
        </Card>
      )}

      {files.length > 0 && (
        <Card size="small" title={`Tài liệu (${files.length})`} style={{ marginBottom: 16 }}>
          <List
            size="small"
            dataSource={files}
            renderItem={(file) => (
              <List.Item>
                <Space>
                  <CheckCircleOutlined style={{ color: '#0F766E' }} />
                  <Text>{file.filename}</Text>
                  <Text type="secondary">({formatFileSize(file.size)})</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Alert
        message="Tệp được lưu riêng tư theo hồ sơ và không tạo đường dẫn công khai."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Button type="primary" size="large" block danger loading={submitting} onClick={handleSubmit}>
        Gửi yêu cầu
      </Button>
    </Card>
  );
}

function formatFileSize(size: number) {
  if (size === 0) return 'N/A';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
